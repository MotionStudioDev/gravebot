const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

// Ana ayar embed'i — temiz, modern tasarım
function buildMainEmbed(settings, author) {
  const status = settings.enabled
    ? '```ansi\n\u001b[32m● AKTİF\u001b[0m```'
    : '```ansi\n\u001b[31m● PASİF\u001b[0m```';

  return new EmbedBuilder()
    .setAuthor({ name: '🎫  Ticket Sistemi Yapılandırması', iconURL: author.displayAvatarURL() })
    .setDescription(
      '> Aşağıdaki menüden ayarlamak istediğin seçeneği seç.\n' +
      '> Kanal ve rol seçimleri **listeden** yapılır, ID girmen gerekmez.'
    )
    .addFields(
      {
        name: '╔═  Mevcut Ayarlar',
        value: [
          `> 📁  **Kategori** — ${settings.category ? `<#${settings.category}>` : '`Ayarlanmamış`'}`,
          `> 📋  **Log Kanal** — ${settings.logChannel ? `<#${settings.logChannel}>` : '`Ayarlanmamış`'}`,
          `> 💾  **Transkript** — ${settings.transcriptChannel ? `<#${settings.transcriptChannel}>` : '`Ayarlanmamış`'}`,
          `> 🛡️  **Destek Rolü** — ${settings.supportRole ? `<@&${settings.supportRole}>` : '`Ayarlanmamış`'}`,
          `> 💬  **Panel Mesajı** — ${settings.ticketMessage ? `\`${settings.ticketMessage.slice(0, 40)}${settings.ticketMessage.length > 40 ? '…' : ''}\`` : '`Ayarlanmamış`'}`,
        ].join('\n'),
        inline: false
      },
      { name: '╚═  Sistem Durumu', value: status, inline: false }
    )
    .setColor(settings.enabled ? 0x43B581 : 0xF04747)
    .setFooter({ text: `${author.tag} tarafından açıldı`, iconURL: author.displayAvatarURL() })
    .setTimestamp();
}

function buildSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_setup_select')
      .setPlaceholder('⚙️  Bir ayar seçin...')
      .addOptions([
        { label: 'Kategori Ayarla',   value: 'category',   description: 'Ticket kanallarının açılacağı kategori', emoji: '📁' },
        { label: 'Log Kanalı',        value: 'log',        description: 'Ticket olaylarının loglanacağı kanal',   emoji: '📋' },
        { label: 'Transkript Kanalı', value: 'transcript', description: 'Ticket kayıtlarının saklanacağı kanal',  emoji: '💾' },
        { label: 'Destek Rolü',       value: 'role',       description: 'Ticketlara erişebilecek destek rolü',    emoji: '🛡️' },
        { label: 'Panel Mesajı',      value: 'message',    description: 'Ticket panelinde görünecek mesaj',       emoji: '💬' },
        { label: 'Sistemi Aktif Et',  value: 'enable',     description: 'Ticket sistemini aktif eder',            emoji: '✅' },
        { label: 'Sistemi Pasif Et',  value: 'disable',    description: 'Ticket sistemini pasif eder',            emoji: '🔴' },
      ])
  );
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_status')
      .setLabel('Durumu Yenile')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('ticket_panel_gonder')
      .setLabel('Ticket Paneli Gönder')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📨')
  );
}

module.exports = {
  name: 'ticket-ayar',
  description: 'Ticket sistemini menü ile yapılandır',
  aliases: ['ticket-setup', 'ticketayar'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [{
          color: 0xF04747,
          description: `❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisi gerekli!`
        }]
      });
    }

    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.ticket) {
      guildData.settings.ticket = { enabled: false, logChannel: null, transcriptChannel: null, category: null, ticketMessage: null, supportRole: null };
    }

    const settings = guildData.settings.ticket;

    return message.reply({
      embeds: [buildMainEmbed(settings, message.author)],
      components: [buildSelectMenu(), buildButtons()]
    });
  }
};
