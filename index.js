const { Client, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Express server (7/24 aktif kalmak için)
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Sunucu ${port} numaralı bağlantı noktasında yürütülüyor.`);
});

const config = require('./config');
const Guild = require('./models/Guild');
const { onGuildCreate, onGuildDelete, trackCommand, handleEAButton } = require('./ea');

const client = new Client(config.clientOptions);

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// EA — sunucuya katılma/ayrılma bildirimleri
client.on('guildCreate', (guild) => onGuildCreate(guild, client));
client.on('guildDelete', (guild) => onGuildDelete(guild, client));

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildData = await Guild.findOne({ guildId: message.guild.id });
  if (!guildData) return;
  
  const prefix = guildData.prefix || 'g!';
  const settings = guildData.settings || {};

  // === KORUMA SİSTEMİ ===
  await checkProtection(message, client, guildData, settings);

  // === AFK SİSTEMİ ===
  await checkAFK(message, client);

  // Komut işleme
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) ||
    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  const { cooldowns } = client;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 2) * 1000; // Default 2 saniye

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu tekrar kullanmak için **${timeLeft.toFixed(1)}** saniye beklemelisin!`
        }]
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    trackCommand(client, message.guild.id, command.name);
    await command.execute(message, args, client, guildData);
  } catch (error) {
    console.error(error);
    message.reply({
      embeds: [{
        color: parseInt(config.colors.error.replace('#', ''), 16),
        description: `${config.emojis.error} Bu komutu çalıştırırken bir hata oluştu!`
      }]
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

// === KORUMA FONKSİYONLARI ===
const swearWords = [
  'amk', 'amq', 'aq', 'mk', 'mq', 'oç', 'oc', 'sg', 'siktir', 'sik',
  'sikerim', 'sikeyim', 'amına', 'ammına', 'götüne', 'göt', 'got',
  'kürah', 'kahpe', 'orospu', 'pezevenk', 'piç', 'pic'
];

async function checkProtection(message, client, guildData, settings) {
  // Küfür Koruması
  if (settings.antiSwear?.enabled) {
    const content = message.content.toLowerCase();
    const foundWord = swearWords.find(word => content.includes(word));
    
    if (foundWord) {
      await message.delete().catch(() => {});
      const punishment = settings.antiSwear.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Küfür', message, client, guildData);
      await sendWarningMessage(message, 'Küfür', 'Küfürlü kelimeler kullanmak yasaktır!', config.colors.error);
      return;
    }
  }

  // Reklam Koruması
  if (settings.antiAdvert?.enabled) {
    const advertPattern = /(discord\.gg\/|discordapp\.com\/invite\/|discord\.me\/)/i;
    if (advertPattern.test(message.content)) {
      await message.delete().catch(() => {});
      const punishment = settings.antiAdvert.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Reklam', message, client, guildData);
      await sendWarningMessage(message, 'Reklam', 'Sunucuda reklam yapmak yasaktır!', config.colors.error);
      return;
    }
  }

  // URL Koruması
  if (settings.antiLink?.enabled) {
    const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/i;
    if (urlPattern.test(message.content)) {
      await message.delete().catch(() => {});
      const punishment = settings.antiLink.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'URL', message, client, guildData);
      await sendWarningMessage(message, 'URL', 'İzinsiz link paylaşımı yasaktır!', config.colors.error);
      return;
    }
  }

  // Caps Koruması
  if (settings.antiCaps?.enabled) {
    const content = message.content.replace(/[^A-ZÇĞIİÖŞÜ]/g, '');
    const capsPercent = (content.length / message.content.length) * 100;
    const maxPercent = settings.antiCaps.maxCapsPercent || 70;
    
    if (capsPercent > maxPercent && message.content.length > 10) {
      await message.delete().catch(() => {});
      const punishment = settings.antiCaps.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Caps', message, client, guildData);
      await sendWarningMessage(message, 'Caps Lock', 'Aşırı büyük harf kullanımı yasaktır!', config.colors.warning);
      return;
    }
  }

  // Flood Koruması
  if (settings.antiFlood?.enabled) {
    const lineCount = message.content.split('\n').length;
    const maxLines = settings.antiFlood.maxLines || 5;
    
    if (lineCount > maxLines) {
      await message.delete().catch(() => {});
      const punishment = settings.antiFlood.punishment || 'mute';
      await applyPunishment(message.member, punishment, 'Flood', message, client, guildData);
      await sendWarningMessage(message, 'Flood', 'Mesaj flood yapma yasaktır!', config.colors.warning);
      return;
    }
  }

  // Spam Koruması
  if (settings.antiSpam?.enabled) {
    const now = Date.now();
    const timeWindow = settings.antiSpam.timeWindow || 5000;
    const maxMessages = settings.antiSpam.maxMessages || 5;

    if (!client.spamMessages) {
      client.spamMessages = new Map();
    }

    const userMessages = client.spamMessages.get(message.author.id) || [];
    userMessages.push(now);
    
    const recentMessages = userMessages.filter(timestamp => now - timestamp < timeWindow);
    client.spamMessages.set(message.author.id, recentMessages);

    if (recentMessages.length > maxMessages) {
      await message.delete().catch(() => {});
      const punishment = settings.antiSpam.punishment || 'mute';
      await applyPunishment(message.member, punishment, 'Spam', message, client, guildData);
      await sendWarningMessage(message, 'Spam', 'Spam yapma yasaktır!', config.colors.warning);
      return;
    }
  }

  // Anti-Mention Koruması
  if (settings.antiMention?.enabled) {
    const mentions = message.mentions.users.size;
    const maxMentions = settings.antiMention.maxMentions || 5;
    
    if (mentions > maxMentions) {
      await message.delete().catch(() => {});
      const punishment = settings.antiMention.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Toplu Etiketleme', message, client, guildData);
      await sendWarningMessage(message, 'Toplu Etiketleme', `Aynı anda en fazla ${maxMentions} kişi etiketlenebilir!`, config.colors.warning);
      return;
    }
  }

  // Anti-Emoji Koruması
  if (settings.antiEmoji?.enabled) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const emojis = message.content.match(emojiRegex);
    const emojiCount = emojis ? emojis.length : 0;
    const maxEmojis = settings.antiEmoji.maxEmojis || 5;
    
    if (emojiCount > maxEmojis) {
      await message.delete().catch(() => {});
      const punishment = settings.antiEmoji.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Emoji Spam', message, client, guildData);
      await sendWarningMessage(message, 'Emoji Spam', `Aynı anda en fazla ${maxEmojis} emoji kullanılabilir!`, config.colors.warning);
      return;
    }
  }

  // Özel Kelime Koruması
  if (settings.customWords?.enabled && settings.customWords.words?.length > 0) {
    const content = message.content.toLowerCase();
    const foundWord = settings.customWords.words.find(word => content.includes(word.toLowerCase()));
    
    if (foundWord) {
      await message.delete().catch(() => {});
      const punishment = settings.customWords.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Yasaklı Kelime', message, client, guildData);
      await sendWarningMessage(message, 'Yasaklı Kelime', 'Bu kelimeyi kullanmak yasaktır!', config.colors.error);
      return;
    }
  }

  // Medya Koruması
  if (settings.mediaProtection?.enabled) {
    const hasAttachment = message.attachments.size > 0;
    const allowedChannels = settings.mediaProtection.allowedChannels || [];
    
    if (hasAttachment && !allowedChannels.includes(message.channel.id)) {
      await message.delete().catch(() => {});
      const punishment = settings.mediaProtection.punishment || 'warn';
      await applyPunishment(message.member, punishment, 'Medya', message, client, guildData);
      await sendWarningMessage(message, 'Medya', 'Bu kanalda resim/video paylaşımı yasaktır!', config.colors.warning);
      return;
    }
  }
}

async function sendWarningMessage(message, reason, warningText, colorHex) {
  const { EmbedBuilder } = require('discord.js');
  const warningEmbed = new EmbedBuilder()
    .setTitle('⚠️ Uyarı!')
    .setDescription(`**${warningText}**`)
    .addFields(
      { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
      { name: '🛡️ Koruma Türü', value: `**${reason}**`, inline: true },
      { name: '⏰ Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    )
    .setColor(parseInt(colorHex.replace('#', ''), 16))
    .setFooter({ text: 'Koruma Sistemi | Otomatik Uyarı' })
    .setTimestamp();

  const sentMsg = await message.channel.send({ embeds: [warningEmbed] });
  
  setTimeout(async () => {
    await sentMsg.delete().catch(() => {});
  }, 2000); // 2 saniye
}

async function applyPunishment(member, punishmentType, reason, message, client, guildData) {
  const logChannelId = guildData.moderationLogChannel;
  
  switch (punishmentType) {
    case 'warn':
      await member.user.send(`⚠️ **Uyarı:** ${reason} koruması nedeniyle uyarıldınız.\n**Sebep:** ${message.content.substring(0, 50)}`)
        .catch(() => {});
      break;
    
    case 'kick':
      if (member.bannable) {
        await member.kick(`${reason} Koruması - Yetkili: Bot`);
      }
      break;
    
    case 'ban':
      if (member.bannable) {
        await member.ban({ reason: `${reason} Koruması`, days: 1 });
      }
      break;
    
    case 'mute':
      const mutedRoleId = guildData.mutedRole;
      if (mutedRoleId) {
        const mutedRole = message.guild.roles.cache.get(mutedRoleId);
        if (mutedRole) {
          await member.roles.add(mutedRoleId, `${reason} Koruması`);
          
          setTimeout(async () => {
            await member.roles.remove(mutedRoleId, 'Susturma süresi doldu');
          }, 60000 * 10);
        }
      }
      break;
  }

  if (logChannelId) {
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const { EmbedBuilder } = require('discord.js');
      const logEmbed = new EmbedBuilder()
        .setTitle(`🛡️ Koruma Sistemi - ${reason}`)
        .setDescription(`**Kullanıcı:** ${member.user.tag} (${member.id})\n**Sebep:** ${reason} koruması\n**Ceza:** ${punishmentType}\n**Mesaj:** \`${message.content.substring(0, 100)}\``)
        .setColor(parseInt(config.colors.error.replace('#', ''), 16))
        .setTimestamp();
      
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
}

// === AFK FONKSİYONLARI ===
async function checkAFK(message, client) {
  if (!client.afkUsers) return;
  
  // Kullanıcı AFK modundan çıktı mı?
  if (client.afkUsers.has(message.author.id)) {
    const afkData = client.afkUsers.get(message.author.id);
    const duration = Math.floor((Date.now() - afkData.timestamp) / 1000);
    
    const durationStr = formatDuration(duration);
    
    // İsimden [AFK] kaldır
    try {
      const currentNickname = message.member.nickname || '';
      if (currentNickname.startsWith('[AFK]')) {
        const newNickname = currentNickname.replace(/^\[AFK\]\s*/, '');
        await message.member.setNickname(newNickname || afkData.oldNickname);
      }
    } catch (error) {
      console.error('AFK nickname geri değiştirilemedi:', error.message);
    }
    
    const embed = new (require('discord.js').EmbedBuilder)()
      .setTitle('🔙 AFK Modundan Çıkış')
      .setDescription(`**${message.author.tag}**, AFK modundan çıktın!`)
      .addFields(
        { name: '⏱️ Süre', value: `**${durationStr}** AFK kaldın.`, inline: true },
        { name: '📝 Sebep', value: afkData.reason, inline: true }
      )
      .setColor(parseInt(config.colors.success.replace('#', ''), 16))
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    client.afkUsers.delete(message.author.id);
    return;
  }
  
  // Birisi AFK kullanıcıyı etiketledi mi?
  if (message.mentions.users.size > 0) {
    for (const [userId, afkData] of client.afkUsers) {
      if (message.mentions.users.has(userId)) {
        const duration = Math.floor((Date.now() - afkData.timestamp) / 1000);
        const durationStr = formatDuration(duration);
        
        const embed = new (require('discord.js').EmbedBuilder)()
          .setTitle('😴 Kullanıcı AFK')
          .setDescription(`**${afkData.username}** şu anda AFK.`)
          .addFields(
            { name: '⏱️ Süre', value: `**${durationStr}**`, inline: true },
            { name: '📝 Sebep', value: afkData.reason, inline: true }
          )
          .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
          .setTimestamp();
        
        await message.reply({ embeds: [embed], ephemeral: true });
        break;
      }
    }
  }
}

function formatDuration(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days} gün ${hours} saat`;
  if (hours > 0) return `${hours} saat ${minutes} dakika`;
  if (minutes > 0) return `${minutes} dakika ${secs} saniye`;
  return `${secs} saniye`;
}
