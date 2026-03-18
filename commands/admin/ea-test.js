const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { sendOwnerDM } = require('../../ea');

module.exports = {
  name: 'ea-test',
  description: 'EA sistemini test eder',
  aliases: ['eatest'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const ownerIds = (process.env.OWNER_IDS || '').split(',').map(s => s.trim());
    if (!ownerIds.includes(message.author.id)) {
      return message.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir!' });
    }

    const guild = message.guild;
    const owner = await guild.fetchOwner().catch(() => null);
    const createdAt = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: '🧪  EA Test — Sunucuya Katılma Simülasyonu', iconURL: client.user.displayAvatarURL() })
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || client.user.displayAvatarURL())
      .addFields(
        { name: '🏠  Sunucu', value: `**${guild.name}**\n\`${guild.id}\``, inline: true },
        { name: '👑  Kurucu', value: owner ? `${owner.user.tag}\n\`${owner.id}\`` : '`Bilinmiyor`', inline: true },
        { name: '👥  Üye Sayısı', value: `**${guild.memberCount}**`, inline: true },
        { name: '📅  Sunucu Kurulumu', value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: true },
        { name: '📊  Toplam Sunucu', value: `Bot şu an **${client.guilds.cache.size}** sunucuda`, inline: false }
      )
      .setColor(0x43B581)
      .setFooter({ text: `TEST | Sunucu ID: ${guild.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ea_msg_${guild.id}`)
        .setLabel('Kurucuya Mesaj At')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✉️'),
      new ButtonBuilder()
        .setCustomId(`ea_leave_${guild.id}`)
        .setLabel('Sunucudan Çık')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚪')
    );

    await sendOwnerDM(client, embed, [row]);
    return message.reply('✅ Test mesajı gönderildi! DM\'lerini kontrol et.');
  }
};
