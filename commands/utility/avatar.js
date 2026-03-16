const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'avatar',
  description: "Kullanıcının avatarını büyütülmüş olarak gösterir",
  aliases: ['pp', 'profil'],
  cooldown: 3,
  async execute(message, args, client, guildData) {
    const targetUser = message.mentions.users.first() || message.author;
    
    const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
    
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${targetUser.tag} - Avatar`)
      .setDescription(`[Resmi İndir](${avatarURL})`)
      .setImage(avatarURL)
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setFooter({ text: `Avatar Kalitesi: 1024x1024` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
