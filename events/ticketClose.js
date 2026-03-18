const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const Guild = require('../models/Guild');

module.exports = {
  async execute(interaction, client) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    
    if (!guildData || !guildData.settings?.ticket) {
      return interaction.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Ticket sistemi bulunamadı!`
        }],
        ephemeral: true
      });
    }

    const ticket = client.tickets?.find(t => t.channelId === interaction.channel.id);
    
    if (!ticket) {
      return interaction.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu bir ticket kanalı değil!`
        }],
        ephemeral: true
      });
    }

    // Marpel tarzı hızlı kapatma - direkt kapat
    const reason = 'Kullanıcı tarafından kapatıldı';

    // Transkript oluştur
    const transcript = generateTranscript(ticket);

    // Transkript'i kaydet
    if (guildData.settings.ticket.transcriptChannel) {
      const transcriptChannel = interaction.guild.channels.cache.get(guildData.settings.ticket.transcriptChannel);
      if (transcriptChannel) {
        const user = await interaction.client.users.fetch(ticket.userId);
        
        const transcriptEmbed = new EmbedBuilder()
          .setTitle('📄 Ticket Transkripti')
          .setDescription(transcript)
          .addFields(
            { name: '👤 Açan Kişi', value: `${user.tag}`, inline: true },
            { name: '⏰ Süre', value: formatDuration(ticket.closedAt - ticket.openedAt), inline: true },
            { name: '🔒 Kapanma Sebebi', value: reason, inline: true }
          )
          .setColor(parseInt(config.colors.main.replace('#', ''), 16))
          .setFooter({ text: `Ticket ID: ${ticket.channelId}` })
          .setTimestamp();

        await transcriptChannel.send({ embeds: [transcriptEmbed] });
      }
    }

    // Ticket bilgilerini güncelle
    ticket.closed = true;
    ticket.closedAt = Date.now();
    ticket.closeReason = reason;

    // Zamanlayıcıyı temizle
    if (ticket.autoCloseTimeout) {
      clearTimeout(ticket.autoCloseTimeout);
    }

    // Listeden çıkar
    if (client.tickets) {
      client.tickets = client.tickets.filter(t => t.channelId !== interaction.channel.id);
    }

    // Kullanıcıya bilgi ver
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket Kapatıldı')
      .setDescription('Ticket başarıyla kapatıldı.')
      .addFields(
        { name: '👤 Açan Kişi', value: ticket.userName, inline: true },
        { name: '⏰ Süre', value: formatDuration(ticket.closedAt - ticket.openedAt), inline: true },
        { name: '🔒 Sebep', value: reason, inline: true }
      )
      .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
      .setFooter({ text: `Kapatan: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [closeEmbed] });

    // Marpel tarzı hızlı silme - 3 saniye sonra
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.error('Ticket kanalı silinemedi:', error);
      }
    }, 3000);

    await interaction.deferUpdate();
  }
};

// Transkript oluşturucu
function generateTranscript(ticket) {
  let transcript = `=== TICKET TRANSKRİPTİ ===\n\n`;
  transcript += `👤 Açan: ${ticket.userName}\n`;
  transcript += `🆔 ID: ${ticket.userId}\n`;
  transcript += `📝 Sebep: ${ticket.reason}\n`;
  transcript += `⏰ Açılma: ${new Date(ticket.openedAt).toLocaleString('tr-TR')}\n`;
  transcript += `⏰ Kapanma: ${new Date(ticket.closedAt || Date.now()).toLocaleString('tr-TR')}\n`;
  transcript += `🔒 Kapanma Sebebi: ${ticket.closeReason || 'Belirtilmedi'}\n`;
  transcript += `⏱️ Toplam Süre: ${formatDuration((ticket.closedAt || Date.now()) - ticket.openedAt)}\n\n`;
  transcript += `========================\n`;
  
  return transcript;
}

// Süre formatla
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} gün ${hours % 24} saat`;
  if (hours > 0) return `${hours} saat ${minutes % 60} dakika`;
  if (minutes > 0) return `${minutes} dakika ${seconds % 60} saniye`;
  return `${seconds} saniye`;
}
