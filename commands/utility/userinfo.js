const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const Case = require('../../models/Case');

module.exports = {
  name: 'userinfo',
  description: 'Kullanıcı hakkında detaylı bilgi verir',
  aliases: ['ui', 'kullanıcı-bilgi'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    const userFlags = target.user.flags ? target.user.flags.toArray() : [];
    const flags = {
      DISCORD_EMPLOYEE: 'Discord Çalışanı',
      DISCORD_PARTNER: 'Discord Partner',
      BUGHUNTER_LEVEL_1: 'Bug Avcısı (Seviye 1)',
      BUGHUNTER_LEVEL_2: 'Bug Avcısı (Seviye 2)',
      HYPESQUAD_EVENTS: 'HypeSquad Events',
      HOUSE_BRAVERY: 'HypeSquad Bravery',
      HOUSE_BRILLIANCE: 'HypeSquad Brilliance',
      HOUSE_BALANCE: 'HypeSquad Balance',
      EARLY_SUPPORTER: 'Erken Destekçi',
      TEAM_USER: 'Takım Üyesi',
      SYSTEM: 'Sistem',
      VERIFIED_BOT: 'Onaylı Bot',
      VERIFIED_DEVELOPER: 'Onaylı Geliştirici'
    };

    const userFlagList = userFlags.map(flag => flags[flag] || flag).join(', ') || 'Yok';

    const positions = target.roles.cache
      .sort((a, b) => b.position - a.position)
      .map(role => role)
      .join(', ');

    const cases = await Case.find({ guildId: message.guild.id, userId: target.id });
    const caseCount = cases.length;
    const banCount = cases.filter(c => c.type === 'ban').length;
    const kickCount = cases.filter(c => c.type === 'kick').length;
    const muteCount = cases.filter(c => c.type === 'mute').length;
    const warnCount = cases.filter(c => c.type === 'warn').length;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.user.username} Bilgileri`)
      .setColor(parseInt(config.colors.info.replace('#', ''), 16))
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 Kullanıcı ID', value: target.id, inline: true },
        { name: '📛 Kullanıcı Adı', value: target.user.tag, inline: true },
        { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '🎯 Sunucuya Katılma', value: target.joinedAt ? `<t:${Math.floor(target.joinedAt / 1000)}:F>` : 'Bilinmiyor', inline: true },
        { name: '🏆 Rozetler', value: userFlagList, inline: false },
        { name: '📈 Sunucu İçi Durum', value: `**Boost:** ${target.premiumSince ? '✅' : '❌'}\n**Bot:** ${target.user.bot ? '✅' : '❌'}\n**Çevrimiçi:** ${target.presence?.status || 'offline'}`, inline: true },
        { name: '📊 Moderasyon Geçmişi', value: `**Toplam:** ${caseCount}\n**Ban:** ${banCount}\n**Kick:** ${kickCount}\n**Mute:** ${muteCount}\n**Warn:** ${warnCount}`, inline: true },
        { name: '🎭 Roller', value: positions || 'Yok', inline: false }
      )
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    if (target.user.bannerURL()) {
      embed.setImage(target.user.bannerURL({ dynamic: true, size: 1024 }));
    }

    await message.reply({ embeds: [embed] });
  }
};
