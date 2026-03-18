const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} = require('discord.js');
const Guild = require('../models/Guild');
const config = require('../config');

function buildTicketSettingsEmbed(settings, user) {
  const tag = user?.tag || user || 'Bilinmiyor';
  const avatar = user?.displayAvatarURL ? user.displayAvatarURL() : undefined;
  const status = settings.enabled
    ? '```ansi\n\u001b[32m● AKTİF\u001b[0m```'
    : '```ansi\n\u001b[31m● PASİF\u001b[0m```';

  return new EmbedBuilder()
    .setAuthor({ name: '🎫  Ticket Sistemi Yapılandırması', iconURL: avatar })
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
    .setFooter({ text: `${tag} tarafından güncellendi`, iconURL: avatar })
    .setTimestamp();
}

function buildMainMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_setup_select')
      .setPlaceholder('⚙️ Ticket ayarlarını seçin...')
      .addOptions([
        { label: 'Kategori Ayarla',   value: 'category',   description: 'Ticket kanallarının açılacağı kategori', emoji: '📁' },
        { label: 'Log Kanal',         value: 'log',        description: 'Ticket olaylarının loglanacağı kanal',   emoji: '📝' },
        { label: 'Transkript Kanalı', value: 'transcript', description: 'Ticket kayıtlarının saklanacağı kanal',  emoji: '💾' },
        { label: 'Destek Rolü',       value: 'role',       description: 'Ticketlara erişebilecek rol',            emoji: '🛡️' },
        { label: 'Panel Mesajı',      value: 'message',    description: 'Ticket panelinde görünecek mesaj',       emoji: '💬' },
        { label: 'Sistemi Aktif Et',  value: 'enable',     description: 'Ticket sistemini aktif eder',            emoji: '✅' },
        { label: 'Sistemi Pasif Et',  value: 'disable',    description: 'Ticket sistemini pasif eder',            emoji: '❌' }
      ])
  );
}

function buildStatusButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_status')
      .setLabel('Durum Göster')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📊')
  );
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── ÇEKİLİŞ BUTONLARI ────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_')) {
      const Giveaway = require('../models/Giveaway');
      const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });

      if (!giveaway) {
        return interaction.reply({ content: '❌ Bu çekiliş artık bulunamıyor!', ephemeral: true });
      }

      if (giveaway.ended) {
        return interaction.reply({ content: '🏁 Bu çekiliş zaten sona erdi!', ephemeral: true });
      }

      // Katılımcıları göster
      if (interaction.customId === 'giveaway_participants') {
        const list = giveaway.participants;
        if (!list.length) {
          return interaction.reply({ content: '👥 Henüz kimse katılmadı!', ephemeral: true });
        }
        const chunks = [];
        for (let i = 0; i < list.length; i += 30) {
          chunks.push(list.slice(i, i + 30).map((id, idx) => `\`${i + idx + 1}.\` <@${id}>`).join('\n'));
        }
        return interaction.reply({
          embeds: [{
            color: 0x5865F2,
            title: `👥  Katılımcılar (${list.length} kişi)`,
            description: chunks[0],
            footer: { text: list.length > 30 ? `+${list.length - 30} kişi daha` : `Toplam ${list.length} katılımcı` }
          }],
          ephemeral: true
        });
      }

      // Katıl
      if (interaction.customId === 'giveaway_join') {
        if (giveaway.participants.includes(interaction.user.id)) {
          return interaction.reply({
            embeds: [{
              color: 0xFAA61A,
              description: '🎟️ Zaten çekiliştesin! Çıkmak için **Çık** butonuna tıkla.'
            }],
            ephemeral: true
          });
        }
        giveaway.participants.push(interaction.user.id);
        await giveaway.save();

        const { buildEmbed, buildButtons } = require('../commands/utility/cekilis');
        const embed = buildEmbed(giveaway.prize, giveaway.winnerCount, giveaway.endsAt, giveaway.hostId, giveaway.participants, false, []);
        await interaction.message.edit({ embeds: [embed], components: [buildButtons(false)] });

        return interaction.reply({
          embeds: [{
            color: 0x43B581,
            description: `🎉 **${giveaway.prize}** çekilişine katıldın! Bol şans! 🍀`
          }],
          ephemeral: true
        });
      }

      // Çık
      if (interaction.customId === 'giveaway_leave') {
        if (!giveaway.participants.includes(interaction.user.id)) {
          return interaction.reply({ content: '❌ Zaten çekilişte değilsin!', ephemeral: true });
        }
        giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
        await giveaway.save();

        const { buildEmbed, buildButtons } = require('../commands/utility/cekilis');
        const embed = buildEmbed(giveaway.prize, giveaway.winnerCount, giveaway.endsAt, giveaway.hostId, giveaway.participants, false, []);
        await interaction.message.edit({ embeds: [embed], components: [buildButtons(false)] });

        return interaction.reply({
          embeds: [{
            color: 0xF04747,
            description: `🚪 **${giveaway.prize}** çekilişinden ayrıldın.`
          }],
          ephemeral: true
        });
      }
    }

    // ── EA BUTONLARI (owner panel) ────────────────────────────────
    if (interaction.isButton() && (interaction.customId.startsWith('ea_msg_') || interaction.customId.startsWith('ea_leave_'))) {
      const { handleEAButton } = require('../ea');
      return handleEAButton(interaction, client);
    }

    // ── SETUP SELECT MENU ─────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'setup_select') {
      const { ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require('discord.js');
      const selected = interaction.values[0];

      // Ayar kaldırma seçenekleri
      if (selected.startsWith('remove_')) {
        const key = selected.replace('remove_', '');
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        const fieldMap = {
          logchannel:     'moderationLogChannel',
          welcomechannel: 'welcomeChannel',
          goodbyechannel: 'goodbyeChannel',
          autorole:       'autoRole',
          mutedrole:      'mutedRole',
          staffroles:     'staffRoles',
        };
        const labelMap = {
          logchannel:     'Log Kanalı',
          welcomechannel: 'Hoş Geldin Kanalı',
          goodbyechannel: 'Güle Güle Kanalı',
          autorole:       'Oto Rol',
          mutedrole:      'Muted Rolü',
          staffroles:     'Yetkili Rolleri',
        };
        if (key === 'staffroles') guildData.staffRoles = [];
        else guildData[fieldMap[key]] = null;
        await guildData.save();

        return interaction.reply({
          embeds: [{ color: 0xF04747, description: `🗑️ **${labelMap[key]}** ayarı kaldırıldı!` }],
          ephemeral: true
        });
      }

      // Divider seçilirse yoksay
      if (selected === 'divider') {
        return interaction.reply({ content: 'Lütfen geçerli bir seçenek seçin.', ephemeral: true });
      }

      const isChannel = ['logchannel', 'welcomechannel', 'goodbyechannel'].includes(selected);

      const labelMap = {
        logchannel:     '📋 Log Kanalı',
        welcomechannel: '👋 Hoş Geldin Kanalı',
        goodbyechannel: '🚪 Güle Güle Kanalı',
        autorole:       '🎭 Oto Rol',
        mutedrole:      '🔇 Muted Rolü',
        staffroles:     '👨‍💼 Yetkili Rolleri',
      };

      let selectRow;
      if (isChannel) {
        selectRow = new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(`setup_pick_${selected}`)
            .setPlaceholder(`${labelMap[selected]} seçin...`)
            .addChannelTypes(ChannelType.GuildText)
        );
      } else if (selected === 'staffroles') {
        selectRow = new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`setup_pick_${selected}`)
            .setPlaceholder(`${labelMap[selected]} seçin...`)
            .setMinValues(1)
            .setMaxValues(10)
        );
      } else {
        selectRow = new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`setup_pick_${selected}`)
            .setPlaceholder(`${labelMap[selected]} seçin...`)
        );
      }

      return interaction.reply({
        embeds: [{ color: 0x5865F2, description: `**${labelMap[selected]}** için seçim yapın:` }],
        components: [selectRow],
        ephemeral: true
      });
    }

    // ── SETUP KANAL/ROL SEÇİMİ ────────────────────────────────────
    if (
      (interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) &&
      interaction.customId.startsWith('setup_pick_')
    ) {
      const key = interaction.customId.replace('setup_pick_', '');
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      if (!guildData) return interaction.update({ content: '❌ Sunucu verisi bulunamadı!', components: [] });

      const fieldMap = {
        logchannel:     'moderationLogChannel',
        welcomechannel: 'welcomeChannel',
        goodbyechannel: 'goodbyeChannel',
        autorole:       'autoRole',
        mutedrole:      'mutedRole',
        staffroles:     'staffRoles',
      };

      const labelMap = {
        logchannel:     'Log Kanalı',
        welcomechannel: 'Hoş Geldin Kanalı',
        goodbyechannel: 'Güle Güle Kanalı',
        autorole:       'Oto Rol',
        mutedrole:      'Muted Rolü',
        staffroles:     'Yetkili Rolleri',
      };

      if (key === 'staffroles') {
        guildData.staffRoles = interaction.values;
      } else {
        guildData[fieldMap[key]] = interaction.values[0];
      }

      await guildData.save();

      const val = key === 'staffroles'
        ? interaction.values.map(r => `<@&${r}>`).join(' ')
        : interaction.isChannelSelectMenu()
          ? `<#${interaction.values[0]}>`
          : `<@&${interaction.values[0]}>`;

      return interaction.update({
        embeds: [{ color: 0x43B581, description: `✅ **${labelMap[key]}** başarıyla ${val} olarak ayarlandı!` }],
        components: []
      });
    }

    // ── SETUP BUTONLARI ───────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'setup_refresh') {
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      const { buildEmbed: _, ...__ } = {}; // sadece import için

      // setup.js'deki buildEmbed'i tekrar kullanmak yerine burada inline yazıyoruz
      const d = guildData;
      const staffVal = d.staffRoles?.length ? d.staffRoles.map(r => `<@&${r}>`).join(' ') : '`Ayarlanmamış`';
      const refreshEmbed = new EmbedBuilder()
        .setAuthor({ name: '⚙️  Bot Kurulum Paneli', iconURL: interaction.user.displayAvatarURL() })
        .setDescription('> Aşağıdaki menüden ayarlamak istediğin seçeneği seç.\n> Kanal ve rol seçimleri **listeden** yapılır.')
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
        .setFooter({ text: `${interaction.user.tag} tarafından yenilendi`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.update({ embeds: [refreshEmbed], components: interaction.message.components });
    }

    if (interaction.isButton() && interaction.customId === 'setup_create_muted') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const existing = interaction.guild.roles.cache.find(r => r.name === 'Muted');
        if (existing) {
          return interaction.editReply({ content: `❌ Zaten bir **Muted** rolü var: <@&${existing.id}>` });
        }

        const mutedRole = await interaction.guild.roles.create({
          name: 'Muted',
          color: '#808080',
          permissions: [],
          reason: 'Setup komutu ile oluşturuldu'
        });

        for (const [, channel] of interaction.guild.channels.cache) {
          await channel.permissionOverwrites.create(mutedRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false,
            Stream: false
          }).catch(() => {});
        }

        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        guildData.mutedRole = mutedRole.id;
        await guildData.save();

        return interaction.editReply({ content: `✅ Muted rolü oluşturuldu ve tüm kanallara uygulandı: <@&${mutedRole.id}>` });
      } catch (err) {
        console.error('Muted rol hatası:', err);
        return interaction.editReply({ content: '❌ Muted rolü oluşturulurken hata oluştu! Yetkileri kontrol et.' });
      }
    }

    if (interaction.isButton() && interaction.customId === 'setup_reset') {
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.moderationLogChannel = null;
      guildData.welcomeChannel = null;
      guildData.goodbyeChannel = null;
      guildData.autoRole = null;
      guildData.mutedRole = null;
      guildData.staffRoles = [];
      await guildData.save();

      const resetEmbed = new EmbedBuilder()
        .setAuthor({ name: '⚙️  Bot Kurulum Paneli', iconURL: interaction.user.displayAvatarURL() })
        .setDescription('> Aşağıdaki menüden ayarlamak istediğin seçeneği seç.\n> Kanal ve rol seçimleri **listeden** yapılır.')
        .addFields({
          name: '╔═  Mevcut Ayarlar',
          value: [
            '> 📋  **Log Kanalı** — `Ayarlanmamış`',
            '> 👋  **Hoş Geldin** — `Ayarlanmamış`',
            '> 🚪  **Güle Güle** — `Ayarlanmamış`',
            '> 🎭  **Oto Rol** — `Ayarlanmamış`',
            '> 🔇  **Muted Rolü** — `Ayarlanmamış`',
            '> 👨‍💼  **Yetkili Rolleri** — `Ayarlanmamış`',
          ].join('\n'),
          inline: false
        })
        .setColor(0xF04747)
        .setFooter({ text: `${interaction.user.tag} tarafından sıfırlandı`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.update({ embeds: [resetEmbed], components: interaction.message.components });
    }

    // ── PREFIX MODAL ──────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'prefix_modal') {
      const newPrefix = interaction.fields.getTextInputValue('prefix_input');
      if (newPrefix.length > 5 || newPrefix.length < 1) {
        return interaction.reply({
          embeds: [{ color: parseInt(config.colors.error.replace('#', ''), 16), description: `${config.emojis.error} Prefix 1-5 karakter arasında olmalıdır!` }],
          ephemeral: true
        });
      }
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.prefix = newPrefix;
      await guildData.save();
      return interaction.reply({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), title: '✅ Prefix Değiştirildi', description: `Prefix \`${newPrefix}\` olarak ayarlandı!`, footer: { text: `İsteyen: ${interaction.user.tag}` }, timestamp: new Date() }],
        ephemeral: true
      });
    }

    // ── ANA AYAR MENÜSÜ ───────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_setup_select') {
      const selected = interaction.values[0];
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      if (!guildData) return interaction.reply({ content: '❌ Sunucu verisi bulunamadı!', ephemeral: true });
      if (!guildData.settings) guildData.settings = {};
      if (!guildData.settings.ticket) guildData.settings.ticket = { enabled: false, logChannel: null, transcriptChannel: null, category: null, ticketMessage: null, supportRole: null };

      const settings = guildData.settings.ticket;

      // Kategori seçici (sadece kategori türü kanallar)
      if (selected === 'category') {
        return interaction.reply({
          embeds: [{ color: parseInt(config.colors.info.replace('#', ''), 16), description: '📁 Ticket kanallarının açılacağı **kategoriyi** seçin:' }],
          components: [
            new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId('ticket_select_category')
                .setPlaceholder('Kategori seçin...')
                .addChannelTypes(ChannelType.GuildCategory)
            )
          ],
          ephemeral: true
        });
      }

      // Log kanal seçici
      if (selected === 'log') {
        return interaction.reply({
          embeds: [{ color: parseInt(config.colors.info.replace('#', ''), 16), description: '📝 Ticket loglarının gönderileceği **kanalı** seçin:' }],
          components: [
            new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId('ticket_select_log')
                .setPlaceholder('Log kanalı seçin...')
                .addChannelTypes(ChannelType.GuildText)
            )
          ],
          ephemeral: true
        });
      }

      // Transkript kanal seçici
      if (selected === 'transcript') {
        return interaction.reply({
          embeds: [{ color: parseInt(config.colors.info.replace('#', ''), 16), description: '💾 Ticket transkriptlerinin gönderileceği **kanalı** seçin:' }],
          components: [
            new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId('ticket_select_transcript')
                .setPlaceholder('Transkript kanalı seçin...')
                .addChannelTypes(ChannelType.GuildText)
            )
          ],
          ephemeral: true
        });
      }

      // Rol seçici
      if (selected === 'role') {
        return interaction.reply({
          embeds: [{ color: parseInt(config.colors.info.replace('#', ''), 16), description: '🛡️ Ticketlara erişebilecek **destek rolünü** seçin:' }],
          components: [
            new ActionRowBuilder().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId('ticket_select_role')
                .setPlaceholder('Destek rolü seçin...')
            )
          ],
          ephemeral: true
        });
      }

      // Panel mesajı — modal gerekiyor (metin girişi)
      if (selected === 'message') {
        const modal = new ModalBuilder().setCustomId('ticket_message_modal').setTitle('Panel Mesajı Ayarla');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('message_input')
              .setLabel('Ticket panelinde görünecek mesaj')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Destek almak için aşağıdaki butona tıklayın!')
              .setRequired(true)
              .setMaxLength(1000)
          )
        );
        return interaction.showModal(modal);
      }

      // Aktif / Pasif
      if (selected === 'enable')  settings.enabled = true;
      if (selected === 'disable') settings.enabled = false;

      guildData.markModified('settings');
      await guildData.save();

      return interaction.update({
        embeds: [buildTicketSettingsEmbed(settings, interaction.user)],
        components: [buildMainMenu(), buildStatusButton()]
      });
    }

    // ── KATEGORİ SEÇİLDİ ─────────────────────────────────────────
    if (interaction.isChannelSelectMenu() && interaction.customId === 'ticket_select_category') {
      const channel = interaction.channels.first();
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.settings.ticket.category = channel.id;
      guildData.markModified('settings');
      await guildData.save();
      return interaction.update({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), description: `✅ Kategori **${channel.name}** olarak ayarlandı!` }],
        components: []
      });
    }

    // ── LOG KANAL SEÇİLDİ ─────────────────────────────────────────
    if (interaction.isChannelSelectMenu() && interaction.customId === 'ticket_select_log') {
      const channel = interaction.channels.first();
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.settings.ticket.logChannel = channel.id;
      guildData.markModified('settings');
      await guildData.save();
      return interaction.update({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), description: `✅ Log kanalı ${channel} olarak ayarlandı!` }],
        components: []
      });
    }

    // ── TRANSKRİPT KANAL SEÇİLDİ ─────────────────────────────────
    if (interaction.isChannelSelectMenu() && interaction.customId === 'ticket_select_transcript') {
      const channel = interaction.channels.first();
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.settings.ticket.transcriptChannel = channel.id;
      guildData.markModified('settings');
      await guildData.save();
      return interaction.update({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), description: `✅ Transkript kanalı ${channel} olarak ayarlandı!` }],
        components: []
      });
    }

    // ── ROL SEÇİLDİ ───────────────────────────────────────────────
    if (interaction.isRoleSelectMenu() && interaction.customId === 'ticket_select_role') {
      const role = interaction.roles.first();
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.settings.ticket.supportRole = role.id;
      guildData.markModified('settings');
      await guildData.save();
      return interaction.update({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), description: `✅ Destek rolü ${role} olarak ayarlandı!` }],
        components: []
      });
    }

    // ── PANEL MESAJI MODAL ────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_message_modal') {
      const msg = interaction.fields.getTextInputValue('message_input').trim();
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.settings.ticket.ticketMessage = msg;
      guildData.markModified('settings');
      await guildData.save();
      return interaction.reply({
        embeds: [{ color: parseInt(config.colors.success.replace('#', ''), 16), description: `✅ Panel mesajı ayarlandı!\n\n> ${msg}` }],
        ephemeral: true
      });
    }

    // ── DURUM BUTONU ──────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_status') {
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      if (!guildData?.settings?.ticket) return interaction.reply({ content: '❌ Ticket sistemi ayarlanmamış!', ephemeral: true });
      const s = guildData.settings.ticket;
      return interaction.update({
        embeds: [buildTicketSettingsEmbed(s, interaction.user)],
        components: interaction.message.components
      });
    }

    // ── TİCKET PANELİ GÖNDER ─────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_panel_gonder') {
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      const s = guildData?.settings?.ticket;

      if (!s?.category) {
        return interaction.reply({ content: '❌ Önce en az **kategori** ayarını yapmalısın!', ephemeral: true });
      }

      const panelEmbed = new EmbedBuilder()
        .setTitle('🎫  Destek Talebi')
        .setDescription(
          s.ticketMessage ||
          '> Bir sorunuz mu var? Destek almak için aşağıdaki butona tıklayın.\n> Ekibimiz en kısa sürede size yardımcı olacaktır.'
        )
        .setColor(0x5865F2)
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      const panelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Ticket Oluştur')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );

      await interaction.channel.send({ embeds: [panelEmbed], components: [panelRow] });
      return interaction.reply({ content: '✅ Ticket paneli bu kanala gönderildi!', ephemeral: true });
    }

    // ── TİCKET OLUŞTUR ────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_create') {
      return require('./ticketCreate').execute(interaction, client);
    }

    // ── TİCKET KAPAT ──────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      return require('./ticketClose').execute(interaction, client);
    }

    // ── SESLİ DESTEK ──────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_voice') {
      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      const ticket = client.tickets?.find(t => t.channelId === interaction.channel.id);
      if (!ticket) return interaction.reply({ content: '❌ Bu bir ticket kanalı değil!', ephemeral: true });

      const member = await interaction.guild.members.fetch(ticket.userId);
      const voiceChannel = await interaction.guild.channels.create({
        name: interaction.channel.name.replace('ticket-', 'voice-'),
        type: 2,
        parent: interaction.channel.parentId,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] },
          { id: member.id, allow: ['ViewChannel', 'Connect', 'Speak'] },
          { id: guildData.settings?.ticket?.supportRole || interaction.guild.roles.cache.find(r => r.permissions.has('ManageChannels'))?.id, allow: ['ViewChannel', 'Connect', 'Speak'] }
        ]
      });

      const updatedEmbed = new EmbedBuilder(interaction.message.embeds[0])
        .addFields({ name: '🎧 Sesli Kanal', value: `${voiceChannel}`, inline: true });

      await interaction.update({
        embeds: [updatedEmbed],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Talebi Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
          new ButtonBuilder().setCustomId('ticket_voice_remove').setLabel('Sesli Kanalı Kapat').setStyle(ButtonStyle.Secondary).setEmoji('🔇')
        )]
      });
      return interaction.followUp({ content: `${voiceChannel} oluşturuldu! ${member} buraya bağlanabilirsin.`, ephemeral: true });
    }

    // ── SESLİ KANAL KAPAT ─────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_voice_remove') {
      const ticket = client.tickets?.find(t => t.channelId === interaction.channel.id);
      if (!ticket) return interaction.reply({ content: '❌ Bu bir ticket kanalı değil!', ephemeral: true });

      const voiceChannel = interaction.guild.channels.cache.find(
        c => c.name === interaction.channel.name.replace('ticket-', 'voice-') && c.type === 2
      );
      if (!voiceChannel) return interaction.reply({ content: '❌ Sesli kanal bulunamadı!', ephemeral: true });

      await voiceChannel.delete();
      await interaction.update({
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Talebi Kapat').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
          new ButtonBuilder().setCustomId('ticket_voice').setLabel('Sesli Destek').setStyle(ButtonStyle.Secondary).setEmoji('🎧')
        )]
      });
      return interaction.followUp({ content: 'Sesli kanal kapatıldı.', ephemeral: true });
    }
  }
};
