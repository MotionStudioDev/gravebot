const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'afk',
  description: 'AFK moduna geçer',
  aliases: ['away', 'uzaktayim'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const reason = args.join(' ') || 'Belirtilmedi';
    
    // AFK bilgisini bir Map'te sakla
    if (!client.afkUsers) {
      client.afkUsers = new Map();
    }
    
    client.afkUsers.set(message.author.id, {
      reason: reason,
      timestamp: Date.now(),
      username: message.author.tag,
      oldNickname: message.member.nickname || message.author.username
    });

    // İsim başına [AFK] ekle
    try {
      const currentNickname = message.member.nickname || message.author.username;
      if (!currentNickname.startsWith('[AFK]')) {
        const newNickname = `[AFK] ${currentNickname}`;
        if (newNickname.length <= 32) {
          await message.member.setNickname(newNickname);
        }
      }
    } catch (error) {
      console.error('AFK nickname değiştirilemedi:', error.message);
    }

    const embed = new EmbedBuilder()
      .setTitle('😴 AFK Modu')
      .setDescription(`**${message.author.tag}** artık AFK!\n\n**Sebep:** ${reason}`)
      .addFields(
        { 
          name: '🕐 Tarih', 
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`, 
          inline: true 
        },
        { 
          name: 'ℹ️ Bilgi', 
          value: 'Birisi sizi etiketlediğinde AFK olduğunuz bildirilecek.', 
          inline: true 
        }
      )
      .setColor(parseInt(config.colors.warning.replace('#', ''), 16))
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: 'AFK modundan çıkmak için herhangi bir mesaj gönderin.' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
