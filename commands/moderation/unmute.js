const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const Case = require('../../models/Case');

module.exports = {
  name: 'unmute',
  description: 'Belirtilen kullanıcının susturmasını açar',
  aliases: ['susturma-ac'],
  permissions: [PermissionFlagsBits.ManageRoles],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const member = message.member;
    if (!member.permissions.has('ManageRoles')) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu kullanmak için **Rolleri Yönet** yetkisine sahip olmalısın!`
        }]
      });
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Susturmasını açmak için bir kullanıcı belirtmelisin!`
        }]
      });
    }

    const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!mutedRole) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Sunucuda Muted rolü bulunamadı!`
        }]
      });
    }

    if (!target.roles.cache.has(mutedRole.id)) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu kullanıcı zaten susturulmamış!`
        }]
      });
    }

    const reason = args.slice(1).join(' ') || 'Belirtilmemiş';

    try {
      await target.roles.remove(mutedRole, `${reason} | Yetkili: ${message.author.tag}`);

      const caseId = guildData.caseCounter;
      guildData.caseCounter += 1;
      await guildData.save();

      const newCase = new Case({
        guildId: message.guild.id,
        caseId: caseId,
        userId: target.id,
        moderatorId: message.author.id,
        type: 'unmute',
        reason: reason
      });
      await newCase.save();

      const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.unmute} Kullanıcının Susturması Açıldı`)
        .setColor(parseInt(config.colors.success.replace('#', ''), 16))
        .addFields(
          { name: '👤 Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
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
            .setTitle('🔊 UNMUTE LOG')
            .setColor(parseInt(config.colors.success.replace('#', ''), 16))
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
            title: '🔊 Susturman Açıldı',
            description: `**${message.guild.name}** sunucusunda susturman açıldı!`,
            color: parseInt(config.colors.success.replace('#', ''), 16),
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
      console.error('Unmute hatası:', error);
      message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Kullanıcının susturması açılırken bir hata oluştu!`
        }]
      });
    }
  }
};
