const Guild = require('../models/Guild');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log(`✅ Yeni sunucuya katıldım: ${guild.name} (ID: ${guild.id})`);

    let guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData) {
      guildData = new Guild({
        guildId: guild.id,
        prefix: 'g!'
      });
      await guildData.save();
      console.log(`✅ ${guild.name} sunucusu için veritabanı kaydı oluşturuldu.`);
    }

    const defaultChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === 'text' && c.permissionsFor(guild.members.me).has('SendMessages'));
    if (defaultChannel) {
      defaultChannel.send({
        embeds: [{
          title: 'Grave Katıldı!',
          description: `Merhaba! Ben Grave botunuz.\n\n**Özellikler:**\n🔨 Ban/Kick/Mute sistemleri\n⚙️ Butonlu prefix ayarlama\n📊 Detaylı log sistemi\n🛡️ Otomatik koruma sistemleri\n\nBaşlamak için \`g!help\` yazın!`,
          color: 0x43B581,
          footer: { text: 'Botu yapılandırmak için g!setup komutunu kullanın' }
        }]
      }).catch(() => {});
    }
  }
};
