const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'setup',
  description: 'Bot kurulumunu butonlu arayüz ile yapar',
  aliases: ['kurulum', 'ayarlar'],
  cooldown: 10,
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

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Kurulum Menüsü')
      .setDescription('Aşağıdaki butonları kullanarak botu kolayca yapılandırabilirsiniz.')
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .addFields(
        { name: '📊 Log Kanalı', value: guildData?.moderationLogChannel ? `<#${guildData.moderationLogChannel}>` : 'Ayarlanmamış', inline: true },
        { name: '👋 Hoş Geldin Kanalı', value: guildData?.welcomeChannel ? `<#${guildData.welcomeChannel}>` : 'Ayarlanmamış', inline: true },
        { name: '👋 Güle Güle Kanalı', value: guildData?.goodbyeChannel ? `<#${guildData.goodbyeChannel}>` : 'Ayarlanmamış', inline: true },
        { name: '🎭 Oto Rol', value: guildData?.autoRole ? `<@&${guildData.autoRole}>` : 'Ayarlanmamış', inline: true },
        { name: '🔇 Muted Rolü', value: guildData?.mutedRole ? `<@&${guildData.mutedRole}>` : 'Ayarlanmamış', inline: true },
        { name: '👨‍💼 Yetkili Rolleri', value: guildData?.staffRoles?.length ? guildData.staffRoles.map(roleId => `<@&${roleId}>`).join(', ') : 'Ayarlanmamış', inline: false }
      )
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_logchannel')
          .setLabel('Log Kanalı')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId('setup_welcomechannel')
          .setLabel('Hoş Geldin')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👋'),
        new ButtonBuilder()
          .setCustomId('setup_autorole')
          .setLabel('Oto Rol')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎭'),
        new ButtonBuilder()
          .setCustomId('setup_mutedrole')
          .setLabel('Muted Rolü')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔇')
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_staffroles')
          .setLabel('Yetkili Rolleri')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👨‍💼'),
        new ButtonBuilder()
          .setCustomId('setup_goodbyechannel')
          .setLabel('Güle Güle')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👋'),
        new ButtonBuilder()
          .setCustomId('setup_create_muted')
          .setLabel('Muted Rolü Oluştur')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔧'),
        new ButtonBuilder()
          .setCustomId('setup_reset')
          .setLabel('Sıfırla')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔄')
      );

    const msg = await message.reply({ embeds: [embed], components: [row, row2] });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

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

      if (interaction.customId === 'setup_create_muted') {
        await interaction.deferUpdate();

        try {
          const mutedRole = await message.guild.roles.create({
            name: 'Muted',
            color: '#808080',
            permissions: [],
            reason: 'Muted rolü oluşturuldu'
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

          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Muted Rolü Oluşturuldu')
            .setDescription(`Muted rolü başarıyla oluşturuldu ve tüm kanallarda ayarlandı!\nRol: <@&${mutedRole.id}>`)
            .setColor(parseInt(config.colors.success.replace('#', ''), 16))
            .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed], components: [] });
          collector.stop();
        } catch (error) {
          console.error('Muted rolü oluşturma hatası:', error);
          await interaction.followUp({
            embeds: [{
              color: parseInt(config.colors.error.replace('#', ''), 16),
              description: `${config.emojis.error} Muted rolü oluşturulurken bir hata oluştu! Yetkilerimi kontrol et.`
            }],
            ephemeral: true
          });
        }
      } else if (interaction.customId === 'setup_reset') {
        await interaction.deferUpdate();

        guildData.moderationLogChannel = null;
        guildData.welcomeChannel = null;
        guildData.goodbyeChannel = null;
        guildData.autoRole = null;
        guildData.mutedRole = null;
        guildData.staffRoles = [];
        await guildData.save();

        const resetEmbed = new EmbedBuilder()
          .setTitle('🔄 Kurulum Sıfırlandı')
          .setDescription('Tüm kurulum ayarları sıfırlandı!')
          .setColor(parseInt(config.colors.success.replace('#', ''), 16))
          .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({ embeds: [resetEmbed], components: [] });
        collector.stop();
      } else {
        const selectMenuType = interaction.customId.replace('setup_', '');
        
        let selectMenu;
        if (selectMenuType.includes('channel')) {
          selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId(`select_${selectMenuType}`)
            .setPlaceholder('Bir kanal seçin')
            .addChannelTypes(0); // Text channels
        } else {
          selectMenu = new RoleSelectMenuBuilder()
            .setCustomId(`select_${selectMenuType}`)
            .setPlaceholder('Bir rol seçin');
        }

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ components: [selectRow], ephemeral: true });

        const selectCollector = interaction.channel.createMessageComponentCollector({ 
          componentType: selectMenuType.includes('channel') ? 8 : 6, // Channel or Role select
          time: 30000 
        });

        selectCollector.on('collect', async (selectInteraction) => {
          if (selectInteraction.user.id !== message.author.id) return;

          await selectInteraction.deferUpdate();

          const selectedValue = selectInteraction.values[0];
          
          switch (selectMenuType) {
            case 'logchannel':
              guildData.moderationLogChannel = selectedValue;
              break;
            case 'welcomechannel':
              guildData.welcomeChannel = selectedValue;
              break;
            case 'goodbyechannel':
              guildData.goodbyeChannel = selectedValue;
              break;
            case 'autorole':
              guildData.autoRole = selectedValue;
              break;
            case 'mutedrole':
              guildData.mutedRole = selectedValue;
              break;
            case 'staffroles':
              guildData.staffRoles = selectInteraction.values;
              break;
          }

          await guildData.save();

          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Ayar Güncellendi')
            .setDescription(`**${selectMenuType}** başarıyla ayarlandı!`)
            .setColor(parseInt(config.colors.success.replace('#', ''), 16))
            .setFooter({ text: `İsteyen: ${selectInteraction.user.tag}`, iconURL: selectInteraction.user.displayAvatarURL() })
            .setTimestamp();

          await selectInteraction.followUp({ embeds: [successEmbed], ephemeral: true });
          selectCollector.stop();
        });

        selectCollector.on('end', (collected, reason) => {
          if (reason === 'time') {
            interaction.deleteReply().catch(() => {});
          }
        });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
