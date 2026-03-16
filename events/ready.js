const { ActivityType } = require('discord.js');
const Guild = require('../models/Guild');

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
    }

    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif!`);
  }
};
