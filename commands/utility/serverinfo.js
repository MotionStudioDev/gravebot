const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Guild = require('../../models/Guild');

module.exports = {
  name: 'serverinfo',
  description: 'Sunucu hakkında detaylı bilgi verir',
  aliases: ['sunucu-bilgi', 'si'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const guild = message.guild;
    const owner = await guild.fetchOwner();

    const channels = {
      text: guild.channels.cache.filter(c => c.type === 0).size,
      voice: guild.channels.cache.filter(c => c.type === 2).size,
      category: guild.channels.cache.filter(c => c.type === 4).size,
      news: guild.channels.cache.filter(c => c.type === 5).size,
      stage: guild.channels.cache.filter(c => c.type === 13).size
    };

    const emojis = guild.emojis.cache;
    const animatedEmojis = emojis.filter(e => e.animated).size;
    const staticEmojis = emojis.size - animatedEmojis;

    const boosts = guild.premiumSubscriptionCount;
    const boostLevel = guild.premiumTier;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name} Sunucu Bilgileri`)
      .setColor(parseInt(config.colors.info.replace('#', ''), 16))
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp()
      .addFields(
        { name: '🆔 Sunucu ID', value: guild.id, inline: true },
        { name: '👑 Sunucu Sahibi', value: owner.user.tag, inline: true },
        { name: '📅 Kuruluş Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '👥 Üyeler', value: `**Toplam:** ${guild.memberCount}\n**Çevrimiçi:** ${guild.members.cache.filter(m => m.presence?.status === 'online').size}\n**Boşta:** ${guild.members.cache.filter(m => m.presence?.status === 'idle').size}\n**Meşgul:** ${guild.members.cache.filter(m => m.presence?.status === 'dnd').size}\n**Çevrimdışı:** ${guild.members.cache.filter(m => !m.presence?.status || m.presence?.status === 'offline').size}`, inline: true },
        { name: '💬 Kanallar', value: `**Metin:** ${channels.text}\n**Sesli:** ${channels.voice}\n**Kategori:** ${channels.category}\n**Haber:** ${channels.news}\n**Sahne:** ${channels.stage}\n**Toplam:** ${guild.channels.cache.size}`, inline: true },
        { name: '🎭 Roller', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 Emojiler', value: `**Toplam:** ${emojis.size}\n**Hareketli:** ${animatedEmojis}\n**Sabit:** ${staticEmojis}`, inline: true },
        { name: '🚀 Boost', value: `**Seviye:** ${boostLevel}\n**Sayı:** ${boosts}\n**Gerekli (S2):** ${boostLevel === 0 ? '7' : boostLevel === 1 ? '14' : '30'}`, inline: true },
        { name: '🔧 Bot Ayarları', value: `**Prefix:** \`${guildData ? guildData.prefix : '!'}\`\n**Log Kanalı:** ${guildData?.moderationLogChannel ? `<#${guildData.moderationLogChannel}>` : 'Ayarlanmamış'}\n**Muted Rolü:** ${guildData?.mutedRole ? `<@&${guildData.mutedRole}>` : 'Ayarlanmamış'}`, inline: false }
      );

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
    }

    await message.reply({ embeds: [embed] });
  }
};
