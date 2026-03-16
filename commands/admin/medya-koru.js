const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'medya-koru',
  description: 'Medya koruması için kanal izinlerini ayarla',
  aliases: ['media-protect', 'medya'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    const member = message.member;
    if (!member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın!`
        }]
      });
    }

    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.mediaProtection) {
      guildData.settings.mediaProtection = { enabled: false, allowedChannels: [], punishment: 'warn' };
    }

    const prefix = guildData.prefix || 'g!';
    const subCommand = args[0]?.toLowerCase();

    // Kanal Ekle
    if (subCommand === 'ekle' || subCommand === 'add' || subCommand === 'izinver') {
      const mentionedChannel = message.mentions.channels.first();
      
      if (!mentionedChannel) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Lütfen bir kanal etiketleyin!\n\n\`${prefix}medya-koru ekle #kanal\``
          }]
        });
      }

      if (guildData.settings.mediaProtection.allowedChannels.includes(mentionedChannel.id)) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            description: `${config.emojis.warning} Bu kanal zaten medya paylaşımına izin verilenler arasında!`
          }]
        });
      }

      guildData.settings.mediaProtection.allowedChannels.push(mentionedChannel.id);
      await guildData.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Kanala İzin Verildi')
        .setDescription(`${mentionedChannel} kanalında medya paylaşımı artık serbest!`)
        .addFields(
          { name: '📺 İzin Verilen Kanallar', value: `**${guildData.settings.mediaProtection.allowedChannels.length}** kanal`, inline: true },
          { name: '🛡️ Koruma Durumu', value: guildData.settings.mediaProtection.enabled ? '✅ Aktif' : '❌ Pasif', inline: true }
        )
        .setColor(parseInt(config.colors.success.replace('#', ''), 16))
        .setFooter({ text: `Ekleyen: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Kanal Çıkar
    if (subCommand === 'çıkar' || subCommand === 'remove' || subCommand === 'yasakla') {
      const mentionedChannel = message.mentions.channels.first();
      
      if (!mentionedChannel) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Lütfen bir kanal etiketleyin!\n\n\`${prefix}medya-koru çıkar #kanal\``
          }]
        });
      }

      const index = guildData.settings.mediaProtection.allowedChannels.indexOf(mentionedChannel.id);
      if (index === -1) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            description: `${config.emojis.warning} Bu kanal zaten izin verilenler listesinde değil!`
          }]
        });
      }

      guildData.settings.mediaProtection.allowedChannels.splice(index, 1);
      await guildData.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Kanaldan İzin Kaldırıldı')
        .setDescription(`${mentionedChannel} kanalında medya paylaşımı artık yasak!`)
        .addFields(
          { name: '📺 İzin Verilen Kanallar', value: `**${guildData.settings.mediaProtection.allowedChannels.length}** kanal`, inline: true },
          { name: '🛡️ Koruma Durumu', value: guildData.settings.mediaProtection.enabled ? '✅ Aktif' : '❌ Pasif', inline: true }
        )
        .setColor(parseInt(config.colors.success.replace('#', ''), 16))
        .setFooter({ text: `Çıkaran: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Liste Göster
    if (subCommand === 'liste' || subCommand === 'list' || subCommand === 'kanallar') {
      const allowedChannels = guildData.settings.mediaProtection.allowedChannels;
      
      const channelMentions = allowedChannels.map(id => {
        const channel = client.channels.cache.get(id);
        return channel ? channel.toString() : `<#${id}>`;
      });

      const embed = new EmbedBuilder()
        .setTitle('📺 Medya İzni Verilen Kanallar')
        .setDescription(allowedChannels.length > 0 
          ? `Toplam **${allowedChannels.length}** kanal\n\n${channelMentions.join('\n')}`
          : 'Henüz hiçbir kanala medya izni verilmemiş.'
        )
        .addFields(
          { name: '🛡️ Koruma Durumu', value: guildData.settings.mediaProtection.enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
          { name: '⚖️ Ceza', value: `\`${guildData.settings.mediaProtection.punishment}\``, inline: true }
        )
        .setColor(parseInt(config.colors.main.replace('#', ''), 16))
        .setFooter({ text: `İsteyen: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Yardım
    const helpEmbed = new EmbedBuilder()
      .setTitle('🖼️ Medya Koruması - Yardım')
      .setDescription('Medya paylaşımını kısıtlamak için aşağıdaki komutları kullanın.')
      .addFields(
        { 
          name: '📥 Kanala İzin Ver', 
          value: `\`${prefix}medya-koru ekle #kanal\`\nÖrnek: \`${prefix}medya-koru ekle #resim-kanalı\``, 
          inline: false 
        },
        { 
          name: '📤 Kanaldan İzin Kaldır', 
          value: `\`${prefix}medya-koru çıkar #kanal\`\nÖrnek: \`${prefix}medya-koru çıkar #resim-kanalı\``, 
          inline: false 
        },
        { 
          name: '📋 Liste Göster', 
          value: `\`${prefix}medya-koru liste\``, 
          inline: false 
        },
        { 
          name: 'ℹ️ Bilgi', 
          value: `Koruma sistemini aktif/pasif etmek için **${prefix}koruma** komutunu kullanın.\n\n**Nasıl Çalışır?**\nMedya koruması aktifken, sadece izin verilen kanallarda resim/video paylaşılabilir. Diğer kanallarda medya otomatik silinir.`, 
          inline: false 
        }
      )
      .setColor(parseInt(config.colors.info.replace('#', ''), 16))
      .setFooter({ text: `İsteyen: ${message.author.tag}` })
      .setTimestamp();

    return message.reply({ embeds: [helpEmbed] });
  }
};
