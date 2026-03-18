const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData?.moderationLogChannel) return;

    const logChannel = guild.channels.cache.get(guildData.moderationLogChannel);
    if (!logChannel) return;

    const member = newState.member || oldState.member;
    const user = member.user;

    // Kanala katıldı
    if (!oldState.channelId && newState.channelId) {
      return logChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setDescription(`🔊 **${user}** ses kanalına katıldı`)
          .addFields({ name: 'Kanal', value: `<#${newState.channelId}>`, inline: true })
          .setColor(0x43B581)
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp()
        ]
      }).catch(() => {});
    }

    // Kanaldan ayrıldı
    if (oldState.channelId && !newState.channelId) {
      return logChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setDescription(`🔇 **${user}** ses kanalından ayrıldı`)
          .addFields({ name: 'Kanal', value: `<#${oldState.channelId}>`, inline: true })
          .setColor(0xF04747)
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp()
        ]
      }).catch(() => {});
    }

    // Kanal değiştirdi
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      return logChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setDescription(`🔀 **${user}** ses kanalını değiştirdi`)
          .addFields(
            { name: 'Önceki', value: `<#${oldState.channelId}>`, inline: true },
            { name: 'Yeni', value: `<#${newState.channelId}>`, inline: true }
          )
          .setColor(0xFAA61A)
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp()
        ]
      }).catch(() => {});
    }

    // Mikrofon açtı/kapattı
    if (oldState.selfMute !== newState.selfMute) {
      return logChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setDescription(`${newState.selfMute ? '🔇' : '🎙️'} **${user}** mikrofonunu ${newState.selfMute ? 'kapattı' : 'açtı'}`)
          .addFields({ name: 'Kanal', value: newState.channelId ? `<#${newState.channelId}>` : 'Bilinmiyor', inline: true })
          .setColor(newState.selfMute ? 0x808080 : 0x43B581)
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp()
        ]
      }).catch(() => {});
    }

    // Kamera açtı/kapattı
    if (oldState.selfVideo !== newState.selfVideo) {
      return logChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
          .setDescription(`${newState.selfVideo ? '📹' : '📷'} **${user}** kamerasını ${newState.selfVideo ? 'açtı' : 'kapattı'}`)
          .addFields({ name: 'Kanal', value: newState.channelId ? `<#${newState.channelId}>` : 'Bilinmiyor', inline: true })
          .setColor(newState.selfVideo ? 0x5865F2 : 0x808080)
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp()
        ]
      }).catch(() => {});
    }
  }
};
