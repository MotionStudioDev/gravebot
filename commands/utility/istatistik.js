const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'istatistik',
  description: 'Detaylı bot istatistiklerini gösterir',
  aliases: ['stats', 'bilgi', 'botbilgi'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const os = require('os');
    
    // RAM kullanımı
    const ramUsage = process.memoryUsage();
    const ramMB = Math.round(ramUsage.heapUsed / 1024 / 1024);
    const ramTotalMB = Math.round(ramUsage.heapTotal / 1024 / 1024);
    
    // CPU bilgisi
    const cpuUsage = (process.cpuUsage()).user / 1000000;
    
    // Sunucu sayısı
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const channelCount = client.channels.cache.size;
    
    // Çalışma süresi
    const uptime = client.uptime;
    const days = Math.floor(uptime / (3600000 * 24));
    const hours = Math.floor((uptime % (3600000 * 24)) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Bot İstatistikleri')
      .setDescription(`**${client.user.username}** botunun detaylı istatistikleri`)
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { 
          name: '🌐 Sunucu Bilgileri', 
          value: `**Sunucular:** ${guildCount}\n**Kullanıcılar:** ${userCount}\n**Kanallar:** ${channelCount}`, 
          inline: true 
        },
        { 
          name: '⚡ Performans', 
          value: `**Ping:** ${client.ws.ping}ms\n**RAM:** ${ramMB}/${ramTotalMB} MB\n**CPU:** ${cpuUsage.toFixed(2)}ms`, 
          inline: true 
        },
        { 
          name: '🕐 Çalışma Süresi', 
          value: `**${days}** gün\n**${hours}** saat\n**${minutes}** dakika\n**${seconds}** saniye`, 
          inline: false 
        },
        { 
          name: '💻 Sistem Bilgileri', 
          value: `**Node.js:** ${process.version}\n**Platform:** ${os.platform()} ${os.arch()}\n**Core:** ${os.cpus().length}`, 
          inline: true 
        },
        { 
          name: '🔤 Sunucu Ayarları', 
          value: `**Prefix:** \`${guildData.prefix}\`\n**Kayıt:** ${new Date(message.createdAt).toLocaleDateString('tr-TR')}`, 
          inline: true 
        },
        { 
          name: '📝 Komut Sayısı', 
          value: `**Toplam:** ${client.commands.size}`, 
          inline: true 
        }
      )
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
