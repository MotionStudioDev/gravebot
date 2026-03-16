const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'ping',
  description: 'Botun ping değerini gösterir',
  aliases: ['ms', 'gecikme'],
  cooldown: 3,
  async execute(message, args, client, guildData) {
    const msg = await message.reply({
      embeds: [{
        color: parseInt(config.colors.info.replace('#', ''), 16),
        description: `${config.emojis.loading} Ping ölçülüyor...`
      }]
    });

    const latency = msg.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle('📊 Bot Ping Değerleri')
      .setColor(parseInt(config.colors.success.replace('#', ''), 16))
      .addFields(
        { name: '📤 Mesaj Gecikmesi', value: `\`${latency}ms\``, inline: true },
        { name: '🌐 API Gecikmesi', value: `\`${apiLatency}ms\``, inline: true },
        { name: '⚡ Durum', value: latency < 100 ? '🟢 Çok İyi' : latency < 200 ? '🟡 İyi' : '🔴 Kötü', inline: true }
      )
      .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await msg.edit({ embeds: [embed] });
  }
};
