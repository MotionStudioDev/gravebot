const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const config = require('../../config');

function buildEmbed(guildData, author) {
  const d = guildData;
  const staffVal = d.staffRoles?.length
    ? d.staffRoles.map(r => `<@&${r}>`).join(' ')
    : '`Ayarlanmamış`';

  return new EmbedBuilder()
    .setAuthor({ name: '⚙️  Bot Kurulum Paneli', iconURL: author.displayAvatarURL() })
    .setDescription(
      '> Aşağıdaki menüden ayarlamak istediğin seçeneği seç.\n' +
      '> Kanal ve rol seçimleri **listeden** yapılır.'
    )
    .addFields({
      name: '╔═  Mevcut Ayarlar',
      value: [
        `> 📋  **Log Kanalı** — ${d.moderationLogChannel ? `<#${d.moderationLogChannel}>` : '`Ayarlanmamış`'}`,
        `> 👋  **Hoş Geldin** — ${d.welcomeChannel ? `<#${d.welcomeChannel}>` : '`Ayarlanmamış`'}`,
        `> 🚪  **Güle Güle** — ${d.goodbyeChannel ? `<#${d.goodbyeChannel}>` : '`Ayarlanmamış`'}`,
        `> 🎭  **Oto Rol** — ${d.autoRole ? `<@&${d.autoRole}>` : '`Ayarlanmamış`'}`,
        `> 🔇  **Muted Rolü** — ${d.mutedRole ? `<@&${d.mutedRole}>` : '`Ayarlanmamış`'}`,
        `> 👨‍💼  **Yetkili Rolleri** — ${staffVal}`,
      ].join('\n'),
      inline: false
    })
    .setColor(0x5865F2)
    .setFooter({ text: `${author.tag} tarafından açıldı`, iconURL: author.displayAvatarURL() })
    .setTimestamp();
}

function buildMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('setup_select')
      .setPlaceholder('⚙️  Bir ayar seçin...')
      .addOptions([
        { label: 'Log Kanalı',       value: 'logchannel',    description: 'Moderasyon loglarının gönderileceği kanal', emoji: '📋' },
        { label: 'Hoş Geldin Kanalı',value: 'welcomechannel',description: 'Yeni üye mesajlarının gönderileceği kanal', emoji: '👋' },
        { label: 'Güle Güle Kanalı', value: 'goodbyechannel',description: 'Ayrılan üye mesajlarının gönderileceği kanal', emoji: '🚪' },
        { label: 'Oto Rol',          value: 'autorole',      description: 'Yeni üyelere otomatik verilecek rol',        emoji: '🎭' },
        { label: 'Muted Rolü',       value: 'mutedrole',     description: 'Susturma işleminde kullanılacak rol',        emoji: '🔇' },
        { label: 'Yetkili Rolleri',  value: 'staffroles',    description: 'Bot komutlarına erişebilecek roller',        emoji: '👨‍💼' },
        { label: '─────────────',   value: 'divider',       description: 'Ayar kaldırma seçenekleri',                  emoji: '🗑️' },
        { label: 'Log Kanalını Kaldır',       value: 'remove_logchannel',    description: 'Log kanalı ayarını sıfırlar',       emoji: '❌' },
        { label: 'Hoş Geldin Kanalını Kaldır',value: 'remove_welcomechannel',description: 'Hoş geldin kanalını sıfırlar',      emoji: '❌' },
        { label: 'Güle Güle Kanalını Kaldır', value: 'remove_goodbyechannel',description: 'Güle güle kanalını sıfırlar',       emoji: '❌' },
        { label: 'Oto Rolü Kaldır',           value: 'remove_autorole',      description: 'Oto rol ayarını sıfırlar',          emoji: '❌' },
        { label: 'Muted Rolünü Kaldır',       value: 'remove_mutedrole',     description: 'Muted rol ayarını sıfırlar',        emoji: '❌' },
        { label: 'Yetkili Rollerini Kaldır',  value: 'remove_staffroles',    description: 'Yetkili rolleri listesini temizler', emoji: '❌' },
      ])
  );
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_refresh')
      .setLabel('Yenile')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('setup_create_muted')
      .setLabel('Muted Rolü Oluştur')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔧'),
    new ButtonBuilder()
      .setCustomId('setup_reset')
      .setLabel('Sıfırla')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️')
  );
}

module.exports = {
  name: 'setup',
  description: 'Bot kurulumunu menü ile yapar',
  aliases: ['kurulum', 'ayarlar'],
  cooldown: 10,
  async execute(message, args, client, guildData) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [{ color: 0xF04747, description: `❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisi gerekli!` }]
      });
    }

    return message.reply({
      embeds: [buildEmbed(guildData, message.author)],
      components: [buildMenu(), buildButtons()]
    });
  }
};
