const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'özel-kelime',
  description: 'Özel kelime koruması için kelime ekle/çıkar/listele',
  aliases: ['customwords', 'kelime'],
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
    if (!guildData.settings.customWords) {
      guildData.settings.customWords = { enabled: false, words: [], punishment: 'warn' };
    }

    const prefix = guildData.prefix || 'g!';
    const subCommand = args[0]?.toLowerCase();

    // Kelime Ekle
    if (subCommand === 'ekle' || subCommand === 'add') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!word) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Lütfen eklemek için bir kelime belirtin!\n\n\`${prefix}özel-kelime ekle <kelime>\``
          }]
        });
      }

      if (guildData.settings.customWords.words.includes(word)) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            description: `${config.emojis.warning} Bu kelime zaten yasaklı kelimeler arasında!`
          }]
        });
      }

      guildData.settings.customWords.words.push(word);
      await guildData.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Kelime Eklendi')
        .setDescription(`**${word}** kelimesi yasaklı kelimeler listesine eklendi!`)
        .addFields(
          { name: '📝 Toplam Kelime', value: `**${guildData.settings.customWords.words.length}**`, inline: true },
          { name: '🛡️ Koruma Durumu', value: guildData.settings.customWords.enabled ? '✅ Aktif' : '❌ Pasif', inline: true }
        )
        .setColor(parseInt(config.colors.success.replace('#', ''), 16))
        .setFooter({ text: `Ekleyen: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Kelime Çıkar
    if (subCommand === 'çıkar' || subCommand === 'remove' || subCommand === 'sil') {
      const word = args.slice(1).join(' ').toLowerCase();
      if (!word) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Lütfen çıkarmak için bir kelime belirtin!\n\n\`${prefix}özel-kelime çıkar <kelime>\``
          }]
        });
      }

      const index = guildData.settings.customWords.words.indexOf(word);
      if (index === -1) {
        return message.reply({
          embeds: [{
            color: parseInt(config.colors.warning.replace('#', ''), 16),
            description: `${config.emojis.warning} Bu kelime yasaklı kelimeler listesinde bulunamadı!`
          }]
        });
      }

      guildData.settings.customWords.words.splice(index, 1);
      await guildData.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Kelime Çıkarıldı')
        .setDescription(`**${word}** kelimesi yasaklı kelimeler listesinden çıkarıldı!`)
        .addFields(
          { name: '📝 Toplam Kelime', value: `**${guildData.settings.customWords.words.length}**`, inline: true },
          { name: '🛡️ Koruma Durumu', value: guildData.settings.customWords.enabled ? '✅ Aktif' : '❌ Pasif', inline: true }
        )
        .setColor(parseInt(config.colors.success.replace('#', ''), 16))
        .setFooter({ text: `Çıkaran: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Liste Göster
    if (subCommand === 'liste' || subCommand === 'list' || subCommand === 'listele') {
      const words = guildData.settings.customWords.words;
      
      const embed = new EmbedBuilder()
        .setTitle('📝 Yasaklı Kelime Listesi')
        .setDescription(words.length > 0 
          ? `Toplam **${words.length}** kelime\n\n${words.map((w, i) => `**${i + 1}.** \`${w}\``).join('\n')}`
          : 'Henüz yasaklı kelime eklenmemiş.'
        )
        .addFields(
          { name: '🛡️ Koruma Durumu', value: guildData.settings.customWords.enabled ? '✅ Aktif' : '❌ Pasif', inline: true },
          { name: '⚖️ Ceza', value: `\`${guildData.settings.customWords.punishment}\``, inline: true }
        )
        .setColor(parseInt(config.colors.main.replace('#', ''), 16))
        .setFooter({ text: `İsteyen: ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Yardım
    const helpEmbed = new EmbedBuilder()
      .setTitle('📝 Özel Kelime Koruması - Yardım')
      .setDescription('Yasaklı kelime listesini yönetmek için aşağıdaki komutları kullanın.')
      .addFields(
        { 
          name: '📥 Kelime Ekle', 
          value: `\`${prefix}özel-kelime ekle <kelime>\`\nÖrnek: \`${prefix}özel-kelime ekle küfür\``, 
          inline: false 
        },
        { 
          name: '📤 Kelime Çıkar', 
          value: `\`${prefix}özel-kelime çıkar <kelime>\`\nÖrnek: \`${prefix}özel-kelime çıkar küfür\``, 
          inline: false 
        },
        { 
          name: '📋 Liste Göster', 
          value: `\`${prefix}özel-kelime liste\``, 
          inline: false 
        },
        { 
          name: 'ℹ️ Bilgi', 
          value: `Koruma sistemini aktif/pasif etmek için **${prefix}koruma** komutunu kullanın.`, 
          inline: false 
        }
      )
      .setColor(parseInt(config.colors.info.replace('#', ''), 16))
      .setFooter({ text: `İsteyen: ${message.author.tag}` })
      .setTimestamp();

    return message.reply({ embeds: [helpEmbed] });
  }
};
