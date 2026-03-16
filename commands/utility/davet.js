const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'davet',
  description: 'Botu sunucunuza davet etmek için link oluşturur',
  aliases: ['invite', 'bot'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const botId = process.env.BOT_ID || client.user.id;
    
    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands`;

    const embed = new EmbedBuilder()
      .setTitle('🔗 Bot Davet Linki')
      .setDescription(`**${client.user.username}** botunu sunucunuza davet etmek için aşağıdaki linke tıklayın!\n\n[Botu Davet Et](${inviteLink})`)
      .addFields(
        { name: '📊 İstatistikler', value: `**${client.guilds.cache.size}** sunucu\n**${client.users.cache.size}** kullanıcı`, inline: true },
        { name: '⚡ Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '🔤 Prefix', value: `\`${guildData.prefix}\``, inline: true }
      )
      .setColor(parseInt(config.colors.main.replace('#', ''), 16))
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: 'Botu diğer sunucularınıza da ekleyebilirsiniz!' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Botu Davet Et')
          .setURL(inviteLink)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setLabel('Destek Sunucusu')
          .setURL('https://discord.gg/gravebot')
          .setStyle(ButtonStyle.Link)
          .setEmoji('💬')
      );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
