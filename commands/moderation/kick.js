const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const Case = require('../../models/Case');

module.exports = {
  name: 'kick',
  description: 'Belirtilen kullanıcıyı sunucudan atar',
  aliases: ['at'],
  permissions: [PermissionFlagsBits.KickMembers],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const member = message.member;
    if (!member.permissions.has('KickMembers')) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu kullanmak için **Üyeleri At** yetkisine sahip olmalısın!`
        }]
      });
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Atmak için bir kullanıcı belirtmelisin!`
        }]
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Kendini atamazsın!`
        }]
      });
    }

    if (target.id === client.user.id) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Beni atamazsın!`
        }]
      });
    }

    if (!target.kickable) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu kullanıcıyı atamıyorum! Yetkim yetersiz.`
        }]
      });
    }

    const reason = args.slice(1).join(' ') || 'Belirtilmemiş';

    try {
      await target.kick(`${reason} | Yetkili: ${message.author.tag}`);

      const caseId = guildData.caseCounter;
      guildData.caseCounter += 1;
      await guildData.save();

      const newCase = new Case({
        guildId: message.guild.id,
        caseId: caseId,
        userId: target.id,
        moderatorId: message.author.id,
        type: 'kick',
        reason: reason
      });
      await newCase.save();

      const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.kick} Kullanıcı Atıldı`)
        .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
        .addFields(
          { name: '👤 Atılan Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: '🔨 Yetkili', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: '📄 Sebep', value: reason, inline: false },
          { name: '🔢 Case ID', value: `#${caseId}`, inline: true }
        )
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      if (guildData.moderationLogChannel) {
        const logChannel = message.guild.channels.cache.get(guildData.moderationLogChannel);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('👢 KICK LOG')
            .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
            .addFields(
              { name: 'Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
              { name: 'Yetkili', value: `${message.author.tag} (${message.author.id})`, inline: true },
              { name: 'Sebep', value: reason, inline: false },
              { name: 'Case ID', value: `#${caseId}`, inline: true }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      try {
        await target.send({
          embeds: [{
            title: '👢 Sunucudan Atıldın',
            description: `**${message.guild.name}** sunucusundan atıldın!`,
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            fields: [
              { name: 'Yetkili', value: message.author.tag, inline: true },
              { name: 'Sebep', value: reason, inline: true },
              { name: 'Case ID', value: `#${caseId}`, inline: true }
            ],
            timestamp: new Date()
          }]
        });
      } catch (err) {
        console.log('Kullanıcıya DM gönderilemedi.');
      }

    } catch (error) {
      console.error('Kick hatası:', error);
      message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Kullanıcı atılırken bir hata oluştu!`
        }]
      });
    }
  }
};
