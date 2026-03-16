const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'koruma',
  description: 'Koruma ayarlarını yapılandırır',
  aliases: ['korumalar', 'protection'],
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

    const settings = guildData.settings || {};

    const getStatus = (setting) => {
      return setting && setting.enabled ? '✅ Aktif' : '❌ Pasif';
    };

    const createEmbed = () => {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Koruma Ayarları')
        .setDescription('Aşağıdaki menüden koruma sistemlerini seçerek aktif/pasif yapabilirsiniz.\n\n**Tek tuşla tüm korumaları açıp kapatabilirsiniz!**')
        .setColor(parseInt(config.colors.main.replace('#', ''), 16))
        .addFields(
          { 
            name: '🔤 Küfür Koruması', 
            value: `Durum: ${getStatus(settings.antiSwear)}\nCeza: \`${settings.antiSwear?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '📢 Reklam Koruması', 
            value: `Durum: ${getStatus(settings.antiAdvert)}\nCeza: \`${settings.antiAdvert?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '🎭 Caps Koruması', 
            value: `Durum: ${getStatus(settings.antiCaps)}\nLimit: %${settings.antiCaps?.maxCapsPercent || 70}\nCeza: \`${settings.antiCaps?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '💬 Flood Koruması', 
            value: `Durum: ${getStatus(settings.antiFlood)}\nLimit: ${settings.antiFlood?.maxLines || 5} satır\nCeza: \`${settings.antiFlood?.punishment || 'mute'}\``, 
            inline: true 
          },
          { 
            name: '🔗 URL Koruması', 
            value: `Durum: ${getStatus(settings.antiLink)}\nCeza: \`${settings.antiLink?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '⚡ Spam Koruması', 
            value: `Durum: ${getStatus(settings.antiSpam)}\nLimit: ${settings.antiSpam?.maxMessages || 5} mesaj / ${settings.antiSpam?.timeWindow || 5000}ms\nCeza: \`${settings.antiSpam?.punishment || 'mute'}\``, 
            inline: true 
          },
          { 
            name: '👥 Etiketleme Koruması', 
            value: `Durum: ${getStatus(settings.antiMention)}\nLimit: ${settings.antiMention?.maxMentions || 5} etiket\nCeza: \`${settings.antiMention?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '😀 Emoji Koruması', 
            value: `Durum: ${getStatus(settings.antiEmoji)}\nLimit: ${settings.antiEmoji?.maxEmojis || 5} emoji\nCeza: \`${settings.antiEmoji?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '📝 Özel Kelime', 
            value: `Durum: ${getStatus(settings.customWords)}\nKelime: ${settings.customWords?.words?.length || 0}\nCeza: \`${settings.customWords?.punishment || 'warn'}\``, 
            inline: true 
          },
          { 
            name: '🖼️ Medya Koruması', 
            value: `Durum: ${getStatus(settings.mediaProtection)}\nKanal: ${(settings.mediaProtection?.allowedChannels || []).length}\nCeza: \`${settings.mediaProtection?.punishment || 'warn'}\``, 
            inline: true 
          }
        )
        .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return embed;
    };

    // Koruma seçim menüsü
    const createSelectMenu = () => {
      const options = [
        { label: 'Küfür Koruması', value: 'antiSwear', emoji: '🔤', description: getStatus(settings.antiSwear) },
        { label: 'Reklam Koruması', value: 'antiAdvert', emoji: '📢', description: getStatus(settings.antiAdvert) },
        { label: 'Caps Koruması', value: 'antiCaps', emoji: '🎭', description: getStatus(settings.antiCaps) },
        { label: 'Flood Koruması', value: 'antiFlood', emoji: '💬', description: getStatus(settings.antiFlood) },
        { label: 'URL Koruması', value: 'antiLink', emoji: '🔗', description: getStatus(settings.antiLink) },
        { label: 'Spam Koruması', value: 'antiSpam', emoji: '⚡', description: getStatus(settings.antiSpam) },
        { label: 'Etiketleme Koruması', value: 'antiMention', emoji: '👥', description: getStatus(settings.antiMention) },
        { label: 'Emoji Koruması', value: 'antiEmoji', emoji: '😀', description: getStatus(settings.antiEmoji) },
        { label: 'Özel Kelime', value: 'customWords', emoji: '📝', description: getStatus(settings.customWords) },
        { label: 'Medya Koruması', value: 'mediaProtection', emoji: '🖼️', description: getStatus(settings.mediaProtection) }
      ];

      return new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('protection_select')
            .setPlaceholder('Koruma sistemi seçin...')
            .addOptions(options)
            .setMaxValues(1)
            .setMinValues(1)
        );
    };

    const createControlRow = () => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('enable_all')
            .setLabel('Tümünü Aktif Et')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('disable_all')
            .setLabel('Tümünü Pasif Et')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );
    };

    const embed = createEmbed();
    const selectMenu = createSelectMenu();
    const controlRow = createControlRow();

    const msg = await message.reply({ 
      embeds: [embed], 
      components: [selectMenu, controlRow] 
    });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Bu menüyü sadece komutu kullanan kişi kullanabilir!`
          }],
          ephemeral: true
        });
      }

      let updated = false;

      if (interaction.customId === 'enable_all') {
        if (!guildData.settings) guildData.settings = {};
        
        guildData.settings.antiSwear = { enabled: true, words: [], punishment: 'warn' };
        guildData.settings.antiAdvert = { enabled: true, punishment: 'warn' };
        guildData.settings.antiCaps = { enabled: true, maxCapsPercent: 70, punishment: 'warn' };
        guildData.settings.antiFlood = { enabled: true, maxLines: 5, punishment: 'mute' };
        guildData.settings.antiLink = { enabled: true, punishment: 'warn' };
        guildData.settings.antiSpam = { enabled: true, maxMessages: 5, timeWindow: 5000, punishment: 'mute' };
        guildData.settings.antiMention = { enabled: true, maxMentions: 5, punishment: 'warn' };
        guildData.settings.antiEmoji = { enabled: true, maxEmojis: 5, punishment: 'warn' };
        guildData.settings.customWords = { enabled: true, words: [], punishment: 'warn' };
        guildData.settings.mediaProtection = { enabled: true, allowedChannels: [], punishment: 'warn' };
        
        updated = true;
      } else if (interaction.customId === 'disable_all') {
        if (!guildData.settings) guildData.settings = {};
        
        guildData.settings.antiSwear = { enabled: false, words: [], punishment: 'warn' };
        guildData.settings.antiAdvert = { enabled: false, punishment: 'warn' };
        guildData.settings.antiCaps = { enabled: false, maxCapsPercent: 70, punishment: 'warn' };
        guildData.settings.antiFlood = { enabled: false, maxLines: 5, punishment: 'mute' };
        guildData.settings.antiLink = { enabled: false, punishment: 'warn' };
        guildData.settings.antiSpam = { enabled: false, maxMessages: 5, timeWindow: 5000, punishment: 'mute' };
        guildData.settings.antiMention = { enabled: false, maxMentions: 5, punishment: 'warn' };
        guildData.settings.antiEmoji = { enabled: false, maxEmojis: 5, punishment: 'warn' };
        guildData.settings.customWords = { enabled: false, words: [], punishment: 'warn' };
        guildData.settings.mediaProtection = { enabled: false, allowedChannels: [], punishment: 'warn' };
        
        updated = true;
      } else if (interaction.customId === 'protection_select') {
        const selectedValue = interaction.values[0];
        
        if (!guildData.settings) guildData.settings = {};
        if (!guildData.settings[selectedValue]) {
          // Varsayılan ayarları oluştur
          const defaults = {
            antiSwear: { enabled: false, words: [], punishment: 'warn' },
            antiAdvert: { enabled: false, punishment: 'warn' },
            antiCaps: { enabled: false, maxCapsPercent: 70, punishment: 'warn' },
            antiFlood: { enabled: false, maxLines: 5, punishment: 'mute' },
            antiLink: { enabled: false, punishment: 'warn' },
            antiSpam: { enabled: false, maxMessages: 5, timeWindow: 5000, punishment: 'mute' },
            antiMention: { enabled: false, maxMentions: 5, punishment: 'warn' },
            antiEmoji: { enabled: false, maxEmojis: 5, punishment: 'warn' },
            customWords: { enabled: false, words: [], punishment: 'warn' },
            mediaProtection: { enabled: false, allowedChannels: [], punishment: 'warn' }
          };
          guildData.settings[selectedValue] = defaults[selectedValue];
        }
        
        // Durumu değiştir
        guildData.settings[selectedValue].enabled = !guildData.settings[selectedValue].enabled;
        updated = true;
      }

      if (updated) {
        await guildData.save();
        const newEmbed = createEmbed();
        const newSelectMenu = createSelectMenu();
        const newControlRow = createControlRow();
        
        await interaction.update({ 
          embeds: [newEmbed], 
          components: [newSelectMenu, newControlRow] 
        });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
