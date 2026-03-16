const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const config = require('../config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildData = await Guild.findOne({ guildId: member.guild.id });
    if (!guildData) return;

    if (guildData.goodbyeChannel) {
      const goodbyeChannel = member.guild.channels.cache.get(guildData.goodbyeChannel);
      if (goodbyeChannel) {
        const goodbyeMessage = guildData.goodbyeMessage
          .replace('{user}', member.user.toString())
          .replace('{username}', member.user.username)
          .replace('{tag}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{count}', member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setTitle('👋 Üye Ayrıldı')
          .setDescription(goodbyeMessage)
          .setColor(parseInt(config.colors.error.replace('#', ''), 16))
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🆔 Kullanıcı ID', value: member.id, inline: true },
            { name: '📅 Sunucuya Katılma', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:R>` : 'Bilinmiyor', inline: true },
            { name: '⏱️ Sunucudaki Süre', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:R>` : 'Bilinmiyor', inline: true }
          )
          .setFooter({ text: `Güle güle ${member.user.username}!`, iconURL: member.user.displayAvatarURL() })
          .setTimestamp();

        try {
          await goodbyeChannel.send({ embeds: [embed] });
        } catch (error) {
          console.error('Güle güle mesajı gönderilemedi:', error);
        }
      }
    }
  }
};
