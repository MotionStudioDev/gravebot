const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildData = await Guild.findOne({ guildId: member.guild.id });
    if (!guildData?.goodbyeChannel) return;

    const goodbyeChannel = member.guild.channels.cache.get(guildData.goodbyeChannel);
    if (!goodbyeChannel) return;

    const msg = (guildData.goodbyeMessage || 'Güle güle {username}!')
      .replace('{user}', member.user.toString())
      .replace('{username}', member.user.username)
      .replace('{tag}', member.user.tag)
      .replace('{server}', member.guild.name)
      .replace('{count}', member.guild.memberCount);

    // Sunucuda ne kadar kaldı
    let stayDuration = '`Bilinmiyor`';
    if (member.joinedAt) {
      const ms = Date.now() - member.joinedAt.getTime();
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      stayDuration = days > 0 ? `${days} gün ${hours} saat` : `${hours} saat`;
    }

    // Sahip olduğu roller (yönetilebilir olanlar)
    const roles = member.roles.cache
      .filter(r => r.id !== member.guild.roles.everyone.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 5)
      .join(' ') || '`Yok`';

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setTitle('🚪  Üye Ayrıldı')
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag}`, inline: true },
        { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
        { name: '📅 Katılma', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : '`Bilinmiyor`', inline: true },
        { name: '⏱️ Kalma Süresi', value: stayDuration, inline: true },
        { name: '👥 Üye Sayısı', value: `**${member.guild.memberCount}**`, inline: true },
        { name: '🎭 Rolleri', value: roles, inline: false }
      )
      .setColor(0xF04747)
      .setFooter({ text: `Güle güle ${member.user.username}!` })
      .setTimestamp();

    await goodbyeChannel.send({ embeds: [embed] }).catch(() => {});
  }
};
