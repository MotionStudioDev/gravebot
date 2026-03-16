const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'hava',
  description: "Hava durumu bilgisini gösterir (Türkiye)",
  aliases: ['weather', 'havadurumu'],
  cooldown: 10,
  async execute(message, args, client, guildData) {
    const city = args.join(' ') || 'Istanbul';
    
    // Sahte hava durumu API'si (gerçek API olmadan çalışması için)
    const weatherTypes = [
      { type: '☀️ Güneşli', temp: [25, 35], desc: 'Açık ve güneşli' },
      { type: '⛅ Parçalı Bulutlu', temp: [20, 28], desc: 'Zamanla bulutlu' },
      { type: '☁️ Bulutlu', temp: [15, 22], desc: 'Kapalı ve serin' },
      { type: '🌧️ Yağmurlu', temp: [12, 18], desc: 'Sağanak yağışlı' },
      { type: '⛈️ Fırtına', temp: [10, 16], desc: 'Gök gürültülü sağanak' },
      { type: '❄️ Karlı', temp: [-5, 5], desc: 'Kar yağışlı' }
    ];
    
    // Şehre göre deterministik rastgelelik
    const citySeed = city.toLowerCase().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const weatherIndex = citySeed % weatherTypes.length;
    const weather = weatherTypes[weatherIndex];
    
    const temp = Math.floor(Math.random() * (weather.temp[1] - weather.temp[0] + 1)) + weather.temp[0];
    const humidity = Math.floor(Math.random() * 40) + 40; // %40-80 arası
    const windSpeed = Math.floor(Math.random() * 30) + 5; // 5-35 km/h
    
    const embed = new EmbedBuilder()
      .setTitle(`🌤️ ${city} - Hava Durumu`)
      .setDescription(`**${weather.type}**\n${weather.desc}`)
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .addFields(
        { 
          name: '🌡️ Sıcaklık', 
          value: `**${temp}°C**`, 
          inline: true 
        },
        { 
          name: '💧 Nem', 
          value: `**%${humidity}**`, 
          inline: true 
        },
        { 
          name: '💨 Rüzgar', 
          value: `**${windSpeed} km/h**`, 
          inline: true 
        },
        { 
          name: '📍 Konum', 
          value: `**${city}**`, 
          inline: true 
        },
        { 
          name: '🕐 Son Güncelleme', 
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`, 
          inline: true 
        },
        { 
          name: 'ℹ️ Not', 
          value: '*Veriler simülasyondur*', 
          inline: false 
        }
      )
      .setFooter({ text: `Komutu kullanan: ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
