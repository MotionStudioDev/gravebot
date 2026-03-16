const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const Case = require('../../models/Case');

module.exports = {
  name: 'mute',
  description: 'Belirtilen kullanıcıyı susturur',
  aliases: ['sustur'],
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
          description: `${config.emojis.error} Susturmak için bir kullanıcı belirtmelisin!`
        }]
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Kendini susturamazsın!`
        }]
      });
    }

    if (target.id === client.user.id) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Beni susturamazsın!`
        }]
      });
    }

    if (target.roles.highest.position >= member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu kullanıcıyı susturamazsın! Rolü senin rolünden yüksek veya aynı.`
        }]
      });
    }

    let mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!mutedRole) {
      try {
        mutedRole = await message.guild.roles.create({
          name: 'Muted',
          color: '#808080',
          permissions: []
        });

        message.guild.channels.cache.forEach(async (channel) => {
          await channel.permissionOverwrites.create(mutedRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false,
            Stream: false
          });
        });

        guildData.mutedRole = mutedRole.id;
        await guildData.save();
      } catch (error) {
        console.error('Muted rolü oluşturulamadı:', error);
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Muted rolü oluşturulamadı! Yetkilerimi kontrol et.`
          }]
        });
      }
    }

    if (target.roles.cache.has(mutedRole.id)) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu kullanıcı zaten susturulmuş!`
        }]
      });
    }

    const reason = args.slice(1).join(' ') || 'Belirtilmemiş';

    try {
      await target.roles.add(mutedRole, `${reason} | Yetkili: ${message.author.tag}`);

      const caseId = guildData.caseCounter;
      guildData.caseCounter += 1;
      await guildData.save();

      const newCase = new Case({
        guildId: message.guild.id,
        caseId: caseId,
        userId: target.id,
        moderatorId: message.author.id,
        type: 'mute',
        reason: reason
      });
      await newCase.save();

      const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.mute} Kullanıcı Susturuldu`)
        .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
        .addFields(
          { name: '👤 Susturulan Kullanıcı', value: `${target.user.tag} (${target.id})`, inline: true },
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
            .setTitle('🔇 MUTE LOG')
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
            title: '🔇 Susturuldun',
            description: `**${message.guild.name}** sunucusunda susturuldun!`,
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
      console.error('Mute hatası:', error);
      message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Kullanıcı susturulurken bir hata oluştu!`
        }]
      });
    }
  }
};
