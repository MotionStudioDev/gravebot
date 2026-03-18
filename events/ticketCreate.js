const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const Guild = require('../models/Guild');

module.exports = {
  async execute(interaction, client) {
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    
    if (!guildData || !guildData.settings?.ticket?.enabled) {
      return interaction.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Ticket sistemi şu anda aktif değil!`
        }],
        ephemeral: true
      });
    }

    const member = interaction.user;
    const prefix = guildData.prefix || 'g!';

    // Zaten açık ticket var mı?
    if (!client.tickets) client.tickets = [];
    const existingTicket = client.tickets.find(t => t.userId === member.id && !t.closed);
    
    if (existingTicket) {
      const channel = interaction.guild.channels.cache.get(existingTicket.channelId);
      if (channel) {
        return interaction.reply({
          embeds: [{
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            description: `${config.emojis.warning} Zaten açık bir ticket'ınız var: ${channel}`
          }],
          ephemeral: true
        });
      }
    }

    // Sebep
    const reason = 'Belirtilmedi';

    // Ticket kategorisi
    const categoryId = guildData.settings.ticket.category;
    const category = categoryId ? interaction.guild.channels.cache.get(categoryId) : null;

    if (!category) {
      return interaction.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Ticket kategorisi bulunamadı! Lütfen yetkililere bildirin.`
        }],
        ephemeral: true
      });
    }

    // Yeni ticket kanalı oluştur
    const ticketName = `ticket-${member.username}`;
    
    const channel = await interaction.guild.channels.create({
      name: ticketName,
      type: 0,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel']
        },
        {
          id: member.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
        },
        {
          id: guildData.settings.ticket.supportRole || interaction.guild.roles.cache.find(r => r.permissions.has('ManageChannels'))?.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
        }
      ]
    });

    // Kanal açıklamasını güncelle
    const now = Date.now();
    const description = `👤 Açan: ${member.tag}\n📝 Sebep: ${reason}\n⏰ Açılma: <t:${Math.floor(now / 1000)}:F>\n🆔 ID: ${member.id}`;
    
    await channel.setTopic(description);

    // Ticket bilgilerini kaydet
    const ticketData = {
      id: channel.id,
      channelId: channel.id,
      userId: member.id,
      userName: member.tag,
      reason: reason,
      openedAt: now,
      closedAt: null,
      closed: false,
      messages: [],
      autoCloseTimeout: null
    };

    client.tickets.push(ticketData);

    // İlk mesajı gönder
    const ticketEmbed = new EmbedBuilder()
      .setTitle('🎫 Destek Talebi Oluşturuldu')
      .setDescription(`Merhaba ${member.tag}, destek talebiniz alındı!\n\nEn kısa sürede size yardımcı olunacaktır.`)
      .addFields(
        { name: '👤 Açan Kişi', value: `${member.tag}`, inline: true },
        { name: '📝 Sebep', value: reason, inline: true },
        { name: '⏰ Açılma Zamanı', value: `<t:${Math.floor(now / 1000)}:F>`, inline: true },
        { name: '🆔 Kullanıcı ID', value: `\`${member.id}\``, inline: true },
        { name: '📋 Durum', value: '**Açık**', inline: true },
        { name: '⚠️ Bilgi', value: 'Yanıt gelmezse **2 dakika** sonra otomatik olarak kapanacaktır.', inline: false }
      )
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setFooter({ text: `Ticket ID: ${channel.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Talebi Kapat')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId('ticket_voice')
          .setLabel('Sesli Destek')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎧')
      );

    await channel.send({ 
      content: `${member.toString()} - Destek ekibi en kısa sürede size yardımcı olacaktır.`,
      embeds: [ticketEmbed],
      components: [row]
    });

    // Kullanıcıya bilgi ver
    await interaction.reply({
      embeds: [{
        color: parseInt(config.colors.success.replace('#', ''), 16),
        description: `${config.emojis.success} Ticket başarıyla oluşturuldu: ${channel}`
      }],
      ephemeral: true
    });

    // Otomatik kapanma zamanlayıcısı (2 dakika = 120 saniye)
    const timeout = setTimeout(async () => {
      const ticketIndex = client.tickets.findIndex(t => t.id === channel.id);
      if (ticketIndex !== -1 && !client.tickets[ticketIndex].closed) {
        const lastMessage = await channel.messages.fetch({ limit: 1 });
        const lastMsg = lastMessage.first();
        
        if (lastMsg && (Date.now() - lastMsg.createdAt.getTime()) > 120000) {
          await channel.send({
            embeds: [{
              color: parseInt(config.colors.warning.replace('#', ''), 16),
              description: `⚠️ Uzun süredir yanıt gelmediği için ticket otomatik olarak kapatılıyor...`
            }]
          });
          
          setTimeout(async () => {
            const closeHandler = require('./ticketClose');
            await closeHandler.execute({ channel: channel, deferUpdate: async () => {} }, client);
          }, 5000);
        }
      }
    }, 120000);

    ticketData.autoCloseTimeout = timeout;

    // Log gönder
    if (guildData.settings.ticket.logChannel) {
      const logChannel = interaction.guild.channels.cache.get(guildData.settings.ticket.logChannel);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🎫 Yeni Ticket Oluşturuldu')
          .setDescription(`Bir kullanıcı yeni ticket açtı.`)
          .addFields(
            { name: '👤 Açan', value: `${member.tag} (\`${member.id}\`)`, inline: true },
            { name: '📝 Sebep', value: reason, inline: true },
            { name: '📺 Kanal', value: `${channel}`, inline: true },
            { name: '⏰ Zaman', value: `<t:${Math.floor(now / 1000)}:F>`, inline: true }
          )
          .setColor(parseInt(config.colors.info.replace('#', ''), 16))
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    }
  }
};
