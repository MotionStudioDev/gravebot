// ea.js — Bot Sunucu Takip Sistemi
// guildCreate / guildDelete event'lerini dinler, owner'a bildirim gönderir
// Ayrıca komut kullanım istatistiklerini tutar

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// Komut istatistikleri (memory — bot restart'ta sıfırlanır)
// client.commandStats = Map<guildId, { total: number, last: string, lastAt: Date }>
// client.totalCommands = number

const EA_LOG_CHANNEL = '1416358157558485022';

function getOwnerIds() {
  return (process.env.OWNER_IDS || process.env.OWNER_ID || '702901632136118273').split(',').map(s => s.trim()).filter(Boolean);
}

async function sendOwnerDM(client, embed, components = []) {
  // DM — tüm owner'lara
  const ownerIds = getOwnerIds();
  for (const ownerId of ownerIds) {
    try {
      const owner = await client.users.fetch(ownerId);
      await owner.send({ embeds: [embed], components });
    } catch (err) {
      console.error(`Owner DM gönderilemedi (${ownerId}):`, err.message);
    }
  }

  // Log kanalına
  try {
    const logChannel = await client.channels.fetch(EA_LOG_CHANNEL);
    if (logChannel) await logChannel.send({ embeds: [embed], components });
  } catch (err) {
    console.error('EA log kanalına gönderilemedi:', err.message);
  }
}

// ── SUNUCUYA KATILDI ──────────────────────────────────────────────────────────
async function onGuildCreate(guild, client) {
  if (!client.commandStats) client.commandStats = new Map();
  if (!client.totalCommands) client.totalCommands = 0;

  const owner = await guild.fetchOwner().catch(() => null);
  const createdAt = Math.floor(guild.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setAuthor({ name: '✅  Yeni Sunucuya Katıldım!', iconURL: client.user.displayAvatarURL() })
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || client.user.displayAvatarURL())
    .addFields(
      { name: '🏠  Sunucu', value: `**${guild.name}**\n\`${guild.id}\``, inline: true },
      { name: '👑  Kurucu', value: owner ? `${owner.user.tag}\n\`${owner.id}\`` : '`Bilinmiyor`', inline: true },
      { name: '👥  Üye Sayısı', value: `**${guild.memberCount}**`, inline: true },
      { name: '📅  Sunucu Kurulumu', value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: true },
      { name: '🌍  Bölge', value: guild.preferredLocale || '`Bilinmiyor`', inline: true },
      { name: '🔒  Doğrulama', value: guild.verificationLevel.toString(), inline: true },
      { name: '📊  Toplam Sunucu', value: `Bot şu an **${client.guilds.cache.size}** sunucuda`, inline: false }
    )
    .setColor(0x43B581)
    .setFooter({ text: `Sunucu ID: ${guild.id}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ea_msg_${guild.id}`)
      .setLabel('Kurucuya Mesaj At')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✉️'),
    new ButtonBuilder()
      .setCustomId(`ea_leave_${guild.id}`)
      .setLabel('Sunucudan Çık')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🚪')
  );

  await sendOwnerDM(client, embed, [row]);
  console.log(`[EA] Katıldı: ${guild.name} (${guild.id}) | Üye: ${guild.memberCount}`);
}

// ── SUNUCUDAN ATILDI / AYRILDI ────────────────────────────────────────────────
async function onGuildDelete(guild, client) {
  const owner = await guild.fetchOwner().catch(() => null);
  const stats = client.commandStats?.get(guild.id);
  const createdAt = Math.floor(guild.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setAuthor({ name: '❌  Sunucudan Ayrıldım / Atıldım', iconURL: client.user.displayAvatarURL() })
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || client.user.displayAvatarURL())
    .addFields(
      { name: '🏠  Sunucu', value: `**${guild.name}**\n\`${guild.id}\``, inline: true },
      { name: '👑  Kurucu', value: owner ? `${owner.user.tag}\n\`${owner.id}\`` : '`Bilinmiyor`', inline: true },
      { name: '👥  Üye Sayısı', value: `**${guild.memberCount}**`, inline: true },
      { name: '📅  Sunucu Kurulumu', value: `<t:${createdAt}:D>`, inline: true },
      { name: '📊  Bu Sunucuda Kullanılan Komut', value: stats ? `**${stats.total}** komut` : '`0` komut', inline: true },
      { name: '🕐  Son Komut', value: stats?.last ? `\`${stats.last}\` — <t:${Math.floor(stats.lastAt / 1000)}:R>` : '`Yok`', inline: true },
      { name: '📊  Kalan Sunucu', value: `Bot şu an **${client.guilds.cache.size}** sunucuda`, inline: false }
    )
    .setColor(0xF04747)
    .setFooter({ text: `Sunucu ID: ${guild.id}` })
    .setTimestamp();

  await sendOwnerDM(client, embed);
  console.log(`[EA] Ayrıldı: ${guild.name} (${guild.id})`);
}

// ── KOMUT KULLANIMI KAYDET ────────────────────────────────────────────────────
function trackCommand(client, guildId, commandName) {
  if (!client.commandStats) client.commandStats = new Map();
  if (!client.totalCommands) client.totalCommands = 0;

  const current = client.commandStats.get(guildId) || { total: 0, last: null, lastAt: null };
  current.total += 1;
  current.last = commandName;
  current.lastAt = Date.now();
  client.commandStats.set(guildId, current);
  client.totalCommands += 1;
}

// ── BUTON HANDLER (interactionCreate'den çağrılır) ────────────────────────────
async function handleEAButton(interaction, client) {
  const ownerIds = getOwnerIds();
  if (!ownerIds.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ Bu butonu sadece bot sahibi kullanabilir!', ephemeral: true });
  }

  // Kurucuya Mesaj At
  if (interaction.customId.startsWith('ea_msg_')) {
    const guildId = interaction.customId.replace('ea_msg_', '');
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({ content: '❌ Sunucu artık bulunamıyor!', ephemeral: true });

    const owner = await guild.fetchOwner().catch(() => null);
    if (!owner) return interaction.reply({ content: '❌ Sunucu kurucusu bulunamadı!', ephemeral: true });

    try {
      await owner.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() })
          .setTitle('📩  Bot Sahibinden Mesaj')
          .setDescription('Merhaba! Bot sahibi sizinle iletişime geçmek istedi.\nLütfen bu mesajı dikkate alın.')
          .setColor(0x5865F2)
          .setTimestamp()
        ]
      });
      return interaction.reply({ content: `✅ **${owner.user.tag}** adlı kurucuya mesaj gönderildi!`, ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Kurucuya DM gönderilemedi (DM\'leri kapalı olabilir).', ephemeral: true });
    }
  }

  // Sunucudan Çık
  if (interaction.customId.startsWith('ea_leave_')) {
    const guildId = interaction.customId.replace('ea_leave_', '');
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({ content: '❌ Sunucu zaten bulunamıyor!', ephemeral: true });

    const guildName = guild.name;
    await guild.leave();
    return interaction.reply({ content: `✅ **${guildName}** sunucusundan ayrıldım.`, ephemeral: true });
  }
}

module.exports = { onGuildCreate, onGuildDelete, trackCommand, handleEAButton, sendOwnerDM };
