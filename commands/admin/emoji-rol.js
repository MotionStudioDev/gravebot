const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType
} = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

// Geçici kurulum verisi — memory'de tutulur
// client.rrSetup = Map<userId, { guildId, title, description, color, roles: [], channelId }>

function getSetup(client, userId, guildId) {
  if (!client.rrSetup) client.rrSetup = new Map();
  if (!client.rrSetup.has(userId)) {
    client.rrSetup.set(userId, {
      guildId,
      title: '🎭 Rol Seçimi',
      description: 'Aşağıdaki butonlara tıklayarak istediğin rolü alabilirsin.',
      color: '5865F2',
      roles: [],
      channelId: null
    });
  }
  return client.rrSetup.get(userId);
}

function buildPreviewEmbed(setup) {
  const color = parseInt(setup.color.replace('#', ''), 16) || 0x5865F2;
  const roleList = setup.roles.length
    ? setup.roles.map((r, i) => `> ${r.emoji}  **${r.label}** — <@&${r.roleId}>`).join('\n')
    : '> *Henüz rol eklenmedi*';

  return new EmbedBuilder()
    .setTitle(setup.title)
    .setDescription(`${setup.description}\n\n${roleList}`)
    .setColor(color)
    .setFooter({ text: `${setup.roles.length} rol • Önizleme` })
    .setTimestamp();
}

function buildSetupEmbed(setup) {
  const roleList = setup.roles.length
    ? setup.roles.map((r, i) => `\`${i + 1}.\` ${r.emoji} **${r.label}** → <@&${r.roleId}>`).join('\n')
    : '`Henüz rol eklenmedi`';

  return new EmbedBuilder()
    .setAuthor({ name: '⚙️  Emoji-Rol Kurulum Paneli' })
    .setDescription('Aşağıdaki menüden ayarları yapılandır, hazır olunca **Gönder** butonuna bas.')
    .addFields(
      { name: '📝  Başlık', value: `\`${setup.title}\``, inline: true },
      { name: '🎨  Renk', value: `\`#${setup.color}\``, inline: true },
      { name: '📺  Kanal', value: setup.channelId ? `<#${setup.channelId}>` : '`Seçilmedi`', inline: true },
      { name: '📋  Açıklama', value: `\`${setup.description.slice(0, 60)}${setup.description.length > 60 ? '…' : ''}\``, inline: false },
      { name: `🎭  Roller (${setup.roles.length}/10)`, value: roleList, inline: false }
    )
    .setColor(parseInt(setup.color.replace('#', ''), 16) || 0x5865F2)
    .setFooter({ text: 'Değişiklikler kaydedilmez, Gönder butonuna basınca aktif olur.' });
}

function buildSetupMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rr_setup_select')
      .setPlaceholder('⚙️  Bir ayar seçin...')
      .addOptions([
        { label: 'Başlık Değiştir',    value: 'title',       description: 'Panel başlığını değiştir',       emoji: '📝' },
        { label: 'Açıklama Değiştir',  value: 'description', description: 'Panel açıklamasını değiştir',    emoji: '📋' },
        { label: 'Renk Değiştir',      value: 'color',       description: 'Embed rengini değiştir (hex)',   emoji: '🎨' },
        { label: 'Kanal Seç',          value: 'channel',     description: 'Panelin gönderileceği kanal',    emoji: '📺' },
        { label: 'Rol Ekle',           value: 'add_role',    description: 'Yeni emoji-rol çifti ekle',      emoji: '➕' },
        { label: 'Rol Sil',            value: 'remove_role', description: 'Mevcut bir rolü kaldır',         emoji: '🗑️' },
        { label: 'Önizleme',           value: 'preview',     description: 'Panelin nasıl görüneceğini gör', emoji: '👁️' },
      ])
  );
}

function buildSetupButtons(setup) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rr_send')
      .setLabel('Gönder')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📨')
      .setDisabled(!setup.channelId || setup.roles.length === 0),
    new ButtonBuilder()
      .setCustomId('rr_cancel')
      .setLabel('İptal')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );
}

module.exports = {
  name: 'emoji-rol',
  description: 'Emoji-Rol paneli oluşturur',
  aliases: ['emojirol', 'reactionrole', 'rr'],
  cooldown: 10,
  // Export helpers for interactionCreate.js
  getSetup,
  buildSetupEmbed,
  buildSetupMenu,
  buildSetupButtons,
  buildPreviewEmbed,
  async execute(message, args, client, guildData) {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply({
        embeds: [{ color: 0xF04747, description: '❌ Bu komutu kullanmak için **Rolleri Yönet** yetkisi gerekli!' }]
      });
    }

    // Önceki kurulumu temizle
    if (!client.rrSetup) client.rrSetup = new Map();
    client.rrSetup.delete(message.author.id);
    const setup = getSetup(client, message.author.id, message.guild.id);

    const msg = await message.reply({
      embeds: [buildSetupEmbed(setup)],
      components: [buildSetupMenu(), buildSetupButtons(setup)]
    });

    // Mesaj ID'sini setup'a kaydet (güncelleme için)
    setup._msgId = msg.id;
    setup._channelId = message.channel.id;
  }
};
