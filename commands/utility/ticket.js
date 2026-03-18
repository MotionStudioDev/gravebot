const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'ticket',
  description: 'Destek talebi oluşturmak için panel gösterir',
  aliases: ['destek', 'support'],
  cooldown: 2,
  async execute(message, args, client, guildData) {
    const prefix = guildData.prefix || 'g!';

    // Ticket ayarları kontrolü
    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.ticket) {
      guildData.settings.ticket = {
        enabled: false,
        logChannel: null,
        transcriptChannel: null,
        category: null,
        ticketMessage: null,
        supportRole: null
      };
    }

    if (!guildData.settings.ticket.enabled) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Ticket sistemi şu anda aktif değil!`
        }]
      });
    }

    // Panel embed - Marpel tarzı daha basit
    const panelEmbed = new EmbedBuilder()
      .setTitle('🎫 Destek Talebi Oluştur')
      .setDescription(guildData.settings.ticket.ticketMessage || 'Aşağıdaki butona basarak destek talebi oluşturabilirsiniz.')
      .addFields(
        { name: '⏱️ Bekleme Süresi', value: '**2 saniye**', inline: true },
        { name: '🔒 Otomatik Kapanma', value: '**2 dakika**', inline: true },
        { name: '🎧 Sesli Destek', value: '**Mevcut**', inline: true },
        { name: '📺 Kategori', value: guildData.settings.ticket.category ? `<#${guildData.settings.ticket.category}>` : 'Belirsiz', inline: false }
      )
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setFooter({ text: 'Destek Sistemi' })
      .setTimestamp();

    const ticketButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Destek Al')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎫')
      );

    return message.reply({ 
      embeds: [panelEmbed],
      components: [ticketButton]
    });
  }
};
