const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildData = await Guild.findOne({ guildId: member.guild.id });
    if (!guildData) return;

    // ── OTO ROL ───────────────────────────────────────────────────
    if (guildData.autoRole) {
      const role = member.guild.roles.cache.get(guildData.autoRole);
      if (role) {
        await member.roles.add(role, 'Oto rol sistemi').catch(err => {
          console.error(`Oto rol verilemedi (${member.guild.name}):`, err.message);
        });
      }
    }

    // ── HOŞ GELDİN MESAJI ─────────────────────────────────────────
    if (!guildData.welcomeChannel) return;
    const welcomeChannel = member.guild.channels.cache.get(guildData.welcomeChannel);
    if (!welcomeChannel) return;

    const msg = (guildData.welcomeMessage || 'Sunucumuza hoş geldin {user}!')
      .replace('{user}', member.toString())
      .replace('{username}', member.user.username)
      .replace('{tag}', member.user.tag)
      .replace('{server}', member.guild.name)
      .replace('{count}', member.guild.memberCount);

    const embed = new EmbedBuilder()
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setTitle('👋  Yeni Üye!')
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 Kullanıcı', value: `${member}`, inline: true },
        { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
        { name: '📅 Hesap Yaşı', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Üye Sayısı', value: `**${member.guild.memberCount}**`, inline: true },
        { name: '🎭 Oto Rol', value: guildData.autoRole ? `<@&${guildData.autoRole}>` : '`Yok`', inline: true }
      )
      .setColor(0x43B581)
      .setFooter({ text: `Hoş geldin ${member.user.username}!` })
      .setTimestamp();

    await welcomeChannel.send({ embeds: [embed] }).catch(() => {});
  }
};
