const { ActivityType } = require('discord.js');
const Guild = require('../models/Guild');
const config = require('../config');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
    
    client.user.setActivity('g!yardım - Çok Yakında', { type: ActivityType.Watching });

    const guilds = client.guilds.cache;
    for (const guild of guilds) {
      let guildData = await Guild.findOne({ guildId: guild[1].id });
      if (!guildData) {
        guildData = new Guild({
          guildId: guild[1].id,
          prefix: 'g!'
        });
        await guildData.save();
        console.log(`✅ ${guild[1].name} sunucusu için veritabanı kaydı oluşturuldu.`);
      }
      
      // Marpel tarzı otomatik ticket paneli (eğer ayarlanmışsa)
      if (guildData.settings?.ticket?.enabled && guildData.settings.ticket.ticketMessage) {
        const channel = guildData.settings.ticket.channel;
        if (channel) {
          const ticketChannel = client.channels.cache.get(channel);
          if (ticketChannel) {
            const panelEmbed = {
              color: parseInt(config.colors.main.replace('#', ''), 16),
              title: '🎫 Destek Talebi Oluştur',
              description: guildData.settings.ticket.ticketMessage,
              fields: [
                { name: '⏱️ Bekleme Süresi', value: '**2 saniye**', inline: true },
                { name: '🔒 Otomatik Kapanma', value: '**2 dakika**', inline: true },
                { name: '🎧 Sesli Destek', value: '**Mevcut**', inline: true }
              ],
              footer: { text: 'Destek Sistemi' },
              timestamp: new Date()
            };
            
            const ticketButton = {
              type: 1,
              components: [{
                type: 2,
                custom_id: 'ticket_create',
                label: 'Destek Al',
                style: 3,
                emoji: { name: '🎫' }
              }]
            };
            
            ticketChannel.send({ embeds: [panelEmbed], components: [ticketButton] }).catch(() => {});
          }
        }
      }
    }

    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif!`);
  }
};
