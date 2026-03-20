const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Giveaway = require('../../models/Giveaway');

// Süre parse — hem "2m" hem "2 dakika" hem "1 saat" hem "30 saniye" algılar
function parseDuration(str) {
  str = str.toLowerCase().trim();

  // Türkçe kelimeler
  const trMap = {
    'saniye': 1000, 'sn': 1000, 's': 1000,
    'dakika': 60000, 'dk': 60000, 'dak': 60000, 'm': 60000,
    'saat': 3600000, 'h': 3600000,
    'gün': 86400000, 'gun': 86400000, 'd': 86400000
  };

  // "2 dakika", "1 saat", "30 saniye" gibi boşluklu
  const spaceMatch = str.match(/^(\d+)\s*(saniye|sn|dakika|dk|dak|saat|gün|gun)$/);
  if (spaceMatch) {
    return parseInt(spaceMatch[1]) * trMap[spaceMatch[2]];
  }

  // "2m", "1h", "30s", "1d" gibi bitişik
  const shortMatch = str.match(/^(\d+)(s|m|h|d)$/);
  if (shortMatch) {
    return parseInt(shortMatch[1]) * trMap[shortMatch[2]];
  }

  return null;
}

function formatRemaining(ms) {
  if (ms <= 0) return 'Bitiyor...';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} saniye`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dakika`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat ${m % 60 > 0 ? m % 60 + ' dakika' : ''}`.trim();
  const d = Math.floor(h / 24);
  return `${d} gün ${h % 24 > 0 ? h % 24 + ' saat' : ''}`.trim();
}

function buildEmbed(prize, winnerCount, endsAt, hostId, participants, ended, winners) {
  const endsAtMs = endsAt instanceof Date ? endsAt.getTime() : endsAt;
  const remaining = endsAtMs - Date.now();
  const endsAtSec = Math.floor(endsAtMs / 1000);

  const winnerStr = ended && winners.length
    ? winners.map(w => `<@${w}>`).join(', ')
    : ended ? '`Katılımcı yok`' : '`Çekiliş devam ediyor`';

  const embed = new EmbedBuilder()
    .setTitle(`🎉  ${prize}`)
    .setDescription(
      [
        `> 🏆  **Kazanan Sayısı:** \`${winnerCount}\``,
        `> 👑  **Düzenleyen:** <@${hostId}>`,
        `> ⏰  **Bitiş:** <t:${endsAtSec}:F>`,
        `> 🕐  **Kalan:** ${ended ? '🏁 Sona erdi' : `<t:${endsAtSec}:R>`}`,
        `> 👥  **Katılımcı:** \`${participants.length}\` kişi`,
        '',
        ended
          ? `> 🎊  **Kazanan(lar):** ${winnerStr}`
          : '> 🎟️  Katılmak için **🎉 Katıl** butonuna tıkla!\n> Çıkmak için **🚪 Çık** butonuna tıkla.'
      ].join('\n')
    )
    .setColor(ended ? 0x808080 : 0xF1C40F)
    .setFooter({ text: ended ? '🏁 Çekiliş sona erdi' : '🎉 Çekiliş aktif — Bol şans!' })
    .setTimestamp(new Date(endsAtMs));

  return embed;
}

function buildButtons(ended) {
  const row = new ActionRowBuilder();
  if (!ended) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Katıl')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId('giveaway_leave')
        .setLabel('Çık')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚪')
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_participants')
      .setLabel('Katılımcılar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👥')
  );
  return row;
}

module.exports = {
  name: 'çekiliş',
  description: 'Çekiliş başlatır',
  aliases: ['cekilis', 'giveaway', 'gw'],
  cooldown: 10,
  async execute(message, args, client, guildData) {
    const prefix = guildData?.prefix || 'g!';

    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [{ color: 0xF04747, description: '❌ Çekiliş başlatmak için **Sunucuyu Yönet** yetkisi gerekli!' }]
      });
    }

    if (args.length < 2) {
      return message.reply({
        embeds: [{
          color: 0xF04747,
          title: '❌ Hatalı Kullanım',
          description: [
            `**Kullanım:** \`${prefix}çekiliş <süre> <ödül>\``,
            `**Kazanan sayısı için:** \`${prefix}çekiliş <süre> <ödül> <kazanan_sayısı>\``,
            '',
            '**Süre örnekleri:**',
            '`30s` veya `30 saniye`',
            '`10m` veya `10 dakika`',
            '`2h` veya `2 saat`',
            '`1d` veya `1 gün`',
            '',
            '**Örnekler:**',
            `\`${prefix}çekiliş 1 saat Discord Nitro\``,
            `\`${prefix}çekiliş 30m Steam Oyunu <3>\``,
            `\`${prefix}çekiliş 2 dakika Test Ödülü\``
          ].join('\n')
        }]
      });
    }

    // Süreyi bul — tek kelime (2m) veya iki kelime (2 dakika)
    let duration = null;
    let prizeStart = 1;
    let winnerCount = 1;

    // Önce tek kelime dene: args[0] = "2m"
    duration = parseDuration(args[0]);
    if (duration) {
      prizeStart = 1;
    } else {
      // İki kelime dene: args[0] + args[1] = "2 dakika"
      if (args.length >= 2) {
        duration = parseDuration(args[0] + ' ' + args[1]);
        if (duration) prizeStart = 2;
      }
    }

    if (!duration) {
      return message.reply({
        embeds: [{
          color: 0xF04747,
          description: `❌ Geçersiz süre!\n\n**Örnekler:** \`${prefix}çekiliş 30s Ödül\`, \`${prefix}çekiliş 2 dakika Ödül\``
        }]
      });
    }

    // Kalan argümanlardan --kazanan <sayı> veya <sayı> formatını çek
    const remaining = args.slice(prizeStart);
    
    // <10> formatını kazanan sayısı olarak algıla — ödülün herhangi bir yerinde olabilir
    const angleBracketIdx = remaining.findIndex(a => /^<\d+>$/.test(a));
    if (angleBracketIdx !== -1) {
      const parsed = parseInt(remaining[angleBracketIdx].replace(/[<>]/g, ''));
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
        winnerCount = parsed;
        remaining.splice(angleBracketIdx, 1);
      }
    }

    // --kazanan <sayı> flag'i
    const winnerFlagIdx = remaining.findIndex(a => a === '--kazanan' || a === '--winner' || a === '-k');
    if (winnerFlagIdx !== -1 && remaining[winnerFlagIdx + 1]) {
      const parsed = parseInt(remaining[winnerFlagIdx + 1]);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
        winnerCount = parsed;
        remaining.splice(winnerFlagIdx, 2);
      }
    }

    const prize = remaining.join(' ').trim();
    if (!prize) {
      return message.reply({
        embeds: [{ color: 0xF04747, description: '❌ Ödül adı belirtmelisin!' }]
      });
    }

    const endsAt = new Date(Date.now() + duration);

    const embed = buildEmbed(prize, winnerCount, endsAt, message.author.id, [], false, []);
    const row = buildButtons(false);

    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});

    const giveaway = new Giveaway({
      messageId:    msg.id,
      channelId:    message.channel.id,
      guildId:      message.guild.id,
      hostId:       message.author.id,
      prize,
      winnerCount,
      participants: [],
      endsAt
    });
    await giveaway.save();

    scheduleGiveaway(client, giveaway);
  },

  buildEmbed,
  buildButtons,
  parseDuration
};

// ── Zamanlayıcı ───────────────────────────────────────────────────────────────
function scheduleGiveaway(client, giveaway) {
  const remaining = new Date(giveaway.endsAt).getTime() - Date.now();
  if (remaining <= 0) {
    endGiveaway(client, giveaway.messageId);
    return;
  }
  setTimeout(() => endGiveaway(client, giveaway.messageId), remaining);
}

async function endGiveaway(client, messageId) {
  const giveaway = await Giveaway.findOne({ messageId });
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;

  const pool = [...giveaway.participants];
  const winners = [];
  while (winners.length < giveaway.winnerCount && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  giveaway.winners = winners;
  await giveaway.save();

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const msg = await channel.messages.fetch(giveaway.messageId);

    const embed = buildEmbed(
      giveaway.prize, giveaway.winnerCount, giveaway.endsAt,
      giveaway.hostId, giveaway.participants, true, winners
    );
    await msg.edit({ embeds: [embed], components: [buildButtons(true)] });

    const winnerMentions = winners.length
      ? winners.map(w => `<@${w}>`).join(', ')
      : '`Kimse katılmadı`';

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎊  Çekiliş Sona Erdi!')
          .setDescription(
            [
              `> 🏆  **Ödül:** ${giveaway.prize}`,
              `> 🎉  **Kazanan(lar):** ${winnerMentions}`,
              `> 👑  **Düzenleyen:** <@${giveaway.hostId}>`,
              '',
              winners.length
                ? `Tebrikler ${winnerMentions}! 🎊`
                : 'Kimse katılmadığı için kazanan yok.'
            ].join('\n')
          )
          .setColor(0xF1C40F)
          .setTimestamp()
      ]
    });
  } catch (err) {
    console.error('Çekiliş bitirme hatası:', err.message);
  }
}

module.exports.scheduleGiveaway = scheduleGiveaway;
module.exports.endGiveaway = endGiveaway;
