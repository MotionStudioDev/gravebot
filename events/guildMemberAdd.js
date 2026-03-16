const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildData = await Guild.findOne({ guildId: member.guild.id });
    if (!guildData) return;

    if (guildData.autoRole) {
      try {
        await member.roles.add(guildData.autoRole, 'Oto rol sistemi');
      } catch (error) {
        console.error('Oto rol verilemedi:', error);
      }
    }

    if (guildData.welcomeChannel) {
      const welcomeChannel = member.guild.channels.cache.get(guildData.welcomeChannel);
      if (welcomeChannel) {
        const welcomeMessage = guildData.welcomeMessage
          .replace('{user}', member.toString())
          .replace('{username}', member.user.username)
          .replace('{tag}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setTitle('👉 Yeni Üye!')
          .setDescription(welcomeMessage)
          .setColor(parseInt(config.colors.success.replace('#', ''), 16))
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🆔 Kullanıcı ID', value: member.id, inline: true },
            { name: '📅 Hesap Yaşı', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👥 Sunucudaki Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
          )
          .setFooter({ text: `Hoş geldin ${member.user.username}!`, iconURL: member.user.displayAvatarURL() })
          .setTimestamp();

        try {
          await welcomeChannel.send({ embeds: [embed] });
        } catch (error) {
          console.error('Hoş geldin mesajı gönderilemedi:', error);
        }
      }
    }
  }
};
