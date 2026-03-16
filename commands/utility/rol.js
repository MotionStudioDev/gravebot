const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'rol',
  description: 'Kullanılabilir rolleri gösterir ve alır',
  aliases: ['roles', 'roller'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    // Otomatik alınabilir roller (ID'leri buraya ekleyebilirsiniz)
    const autoRoles = [
      { id: 'bildirim', name: '📢 Bildirimler', emoji: '🔔', desc: 'Duyuruları almak için' },
      { id: 'etkinlik', name: 'Etkinlikler', emoji: '🎉', desc: 'Etkinlik haberleri için' },
      { id: 'youtube', name: 'YouTuber', emoji: '📹', desc: 'YouTube bildirimleri için' },
      { id: 'twitch', name: 'Twitcher', emoji: '🎮', desc: 'Yayın bildirimleri için' },
      { id: 'instagram', name: 'Instagram', emoji: '📸', desc: 'IG bildirimleri için' },
      { id: 'twitter', name: 'Twitter', emoji: '🐦', desc: 'Tweet bildirimleri için' }
    ];

    const embed = new EmbedBuilder()
      .setTitle('🎭 Rol Sistemi')
      .setDescription('Aşağıdaki butonlara basarak otomatik rolleri alabilirsiniz.\n\n**Mevcut Roller:**')
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setFooter({ text: `İsteyen: ${message.author.tag}` })
      .setTimestamp();

    // Her rol için field ekle
    autoRoles.forEach(role => {
      embed.addFields({
        name: `${role.emoji} ${role.name}`,
        value: role.desc,
        inline: true
      });
    });

    // Butonları oluştur
    const buttons = autoRoles.map(role => 
      new ButtonBuilder()
        .setCustomId(`role_${role.id}`)
        .setLabel(role.name)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(role.emoji)
    );

    // 5'ten fazla buton varsa satırlara böl
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
      rows.push(row);
    }

    const msg = await message.reply({ embeds: [embed], components: rows });

    // Buton kolektörü
    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId.startsWith('role_')) {
        const roleId = interaction.customId.replace('role_', '');
        const selectedRole = autoRoles.find(r => r.id === roleId);
        
        if (!selectedRole) return;

        // Gerçek bir rol ID'si bul (simülasyon için rastgele)
        let actualRole = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(selectedRole.name.toLowerCase()));
        
        if (!actualRole) {
          // Rol yoksa bilgi ver
          return interaction.reply({
            embeds: [{
              color: parseInt(config.colors.warning.replace('#', ''), 16),
              description: `${selectedRole.emoji} **${selectedRole.name}** rolü sunucuda bulunamadı!`,
            }],
            ephemeral: true
          });
        }

        const member = await message.guild.members.fetch(interaction.user.id);
        const hasRole = member.roles.cache.has(actualRole.id);

        if (hasRole) {
          // Rolü kaldır
          await member.roles.remove(actualRole);
          await interaction.reply({
            embeds: [{
              color: parseInt(config.colors.error.replace('#', ''), 16),
              description: `${selectedRole.emoji} **${selectedRole.name}** rolü üzerinizden alındı!`,
            }],
            ephemeral: true
          });
        } else {
          // Rolü ver
          await member.roles.add(actualRole);
          await interaction.reply({
            embeds: [{
              color: parseInt(config.colors.success.replace('#', ''), 16),
              description: `${selectedRole.emoji} **${selectedRole.name}** rolü başarıyla eklendi!`,
            }],
            ephemeral: true
          });
        }
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};
