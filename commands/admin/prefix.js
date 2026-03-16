const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'prefix',
  description: 'Bot prefix\'ini butonlu arayüz ile değiştirir',
  aliases: ['ayarla', 'settings'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const member = message.member;
    if (!member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın!`
        }]
      });
    }

    const currentPrefix = guildData ? guildData.prefix : '!';

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Ayarları')
      .setDescription(`Mevcut prefix: \`${currentPrefix}\`\n\nAşağıdaki butonları kullanarak ayarları değiştirebilirsiniz.`)
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .addFields(
        { name: '🔤 Prefix Değiştir', value: 'Botun komut prefix\'ini değiştirir', inline: true },
        { name: '📊 İstatistikler', value: 'Bot istatistiklerini görüntüle', inline: true },
        { name: '🔄 Sıfırla', value: 'Tüm ayarları varsayılana döndür', inline: true }
      )
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('change_prefix')
          .setLabel('Prefix Değiştir')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔤'),
        new ButtonBuilder()
          .setCustomId('bot_stats')
          .setLabel('İstatistikler')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId('reset_settings')
          .setLabel('Sıfırla')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔄')
      );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Bu butonu sadece komutu kullanan kişi kullanabilir!`
          }],
          ephemeral: true
        });
      }

      if (interaction.customId === 'change_prefix') {
        const modal = new ModalBuilder()
          .setCustomId('prefix_modal')
          .setTitle('Prefix Değiştir')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('prefix_input')
                .setLabel('Yeni prefix girin')
                .setPlaceholder('Örnek: !, ?, ., >')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(5)
                .setValue(currentPrefix)
            )
          );

        await interaction.showModal(modal);
      } else if (interaction.customId === 'bot_stats') {
        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 Bot İstatistikleri')
          .setColor(parseInt(config.colors.info.replace('#', ''), 16))
          .addFields(
            { name: '🌐 Sunucular', value: `${client.guilds.cache.size}`, inline: true },
            { name: '👥 Kullanıcılar', value: `${client.users.cache.size}`, inline: true },
            { name: '📝 Komutlar', value: `${client.commands.size}`, inline: true },
            { name: '⚡ Ping', value: `${client.ws.ping}ms`, inline: true },
            { name: '🔤 Mevcut Prefix', value: `\`${currentPrefix}\``, inline: true },
            { name: '🕐 Çalışma Süresi', value: `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.update({ embeds: [statsEmbed], components: [] });
        collector.stop();
      } else if (interaction.customId === 'reset_settings') {
        await interaction.deferUpdate();

        guildData.prefix = '!';
        guildData.moderationLogChannel = null;
        guildData.welcomeChannel = null;
        guildData.goodbyeChannel = null;
        guildData.autoRole = null;
        guildData.mutedRole = null;
        guildData.staffRoles = [];
        await guildData.save();

        const resetEmbed = new EmbedBuilder()
          .setTitle('🔄 Ayarlar Sıfırlandı')
          .setDescription('Tüm ayarlar varsayılan değerlere döndürüldü!')
          .setColor(parseInt(config.colors.success.replace('#', ''), 16))
          .addFields(
            { name: 'Yeni Prefix', value: '`!`', inline: true },
            { name: 'Log Kanalı', value: 'Ayarlanmadı', inline: true },
            { name: 'Hoş Geldin Kanalı', value: 'Ayarlanmadı', inline: true }
          )
          .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({ embeds: [resetEmbed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
