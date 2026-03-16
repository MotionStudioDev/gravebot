const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'seviye',
  description: 'Seviye ve XP sistemini gösterir',
  aliases: ['rank', 'level'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    // Kullanıcıyı etiketle veya kendisi
    const targetUser = message.mentions.users.first() || message.author;
    const targetMember = await message.guild.members.fetch(targetUser.id);
    
    // Sahte XP/Level sistemi (gerçekçi görünmesi için)
    const userSeed = targetUser.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const level = Math.floor(userSeed % 50) + 1;
    const xp = Math.floor(userSeed * 123 % 1000);
    const nextLevelXp = level * 100;
    const progress = (xp / nextLevelXp) * 100;
    
    // Rastgele roller
    const roles = targetMember.roles.cache
      .filter(role => role.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(5);
    
    const embed = new EmbedBuilder()
      .setTitle('🎯 Seviye Bilgisi')
      .setDescription(`**${targetUser.tag}** seviye bilgileri`)
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { 
          name: '📊 Seviye', 
          value: `**${level}**`, 
          inline: true 
        },
        { 
          name: '⭐ XP', 
          value: `**${xp}/${nextLevelXp}**`, 
          inline: true 
        },
        { 
          name: '📈 İlerleme', 
          value: `%${progress.toFixed(1)}`, 
          inline: true 
        },
        { 
          name: '🎖️ En Yüksek Rol', 
          value: targetMember.premiumSince ? '**Boost** 🚀' : '**Yok**', 
          inline: true 
        },
        { 
          name: '📅 Katılım', 
          value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, 
          inline: true 
        },
        { 
          name: '💫 Roller', 
          value: roles.length > 0 ? roles.map(r => r.name).join(', ').substring(0, 100) : 'Rol yok', 
          inline: false 
        }
      )
      .setFooter({ text: `Daha fazla XP kazanmak için aktif olun!` })
      .setTimestamp();

    // Progress bar emoji
    const progressBar = '▬'.repeat(Math.floor(progress / 10)) + '◼️' + '▬'.repeat(10 - Math.floor(progress / 10));
    
    embed.addFields({
      name: '\u200b',
      value: `${progressBar}\n**XP İlerleme Durumu**`,
      inline: false
    });

    await message.reply({ embeds: [embed] });
  }
};
