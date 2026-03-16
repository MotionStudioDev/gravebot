const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'help',
  description: 'Yardım menüsünü gösterir',
  aliases: ['yardım', 'y'],
  cooldown: 3,
  async execute(message, args, client, guildData) {
    const prefix = guildData ? guildData.prefix : '!';

    // Komutları klasörlerden otomatik topla
    const categories = {};
    const commandFolders = ['moderation', 'admin', 'utility'];
    
    for (const folder of commandFolders) {
      const fs = require('fs');
      const path = require('path');
      const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
      
      const categoryNames = {
        moderation: { name: 'Moderasyon', emoji: '🔨' },
        admin: { name: 'Yönetim', emoji: '⚙️' },
        utility: { name: 'Araçlar', emoji: '🔧' }
      };
      
      const commands = [];
      for (const file of commandFiles) {
        try {
          const command = require(`../../commands/${folder}/${file}`);
          if (command.name && command.description) {
            commands.push({ 
              name: command.name, 
              description: command.description,
              aliases: command.aliases || []
            });
          }
        } catch (error) {
          console.error(`Komut yüklenemedi (${folder}/${file}):`, error.message);
        }
      }
      
      if (commands.length > 0) {
        categories[folder] = {
          name: `${categoryNames[folder].emoji} ${categoryNames[folder].name}`,
          commands: commands
        };
      }
    }

    let currentPage = 0;
    const categoryKeys = Object.keys(categories);

    const createEmbed = (page) => {
      const category = categories[categoryKeys[page]];
      const embed = new EmbedBuilder()
        .setTitle(`${category.name} Komutları`)
        .setColor(parseInt(config.colors.main.replace('#', ''), 16))
        .setDescription(`Prefix: \`${prefix}\`\n\n${category.commands.map((cmd, index) => `**${index + 1}.** \`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n')}`)
        .addFields({
          name: '\u200b',
          value: `Toplam **${category.commands.length}** komut`,
          inline: false
        })
        .setThumbnail(message.guild.iconURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `Sayfa ${page + 1}/${categoryKeys.length} | İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return embed;
    };

    const createButtons = (page) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀ Önceki')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Sonraki ▶')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('➡️')
            .setDisabled(page === categoryKeys.length - 1),
          new ButtonBuilder()
            .setCustomId('all_commands')
            .setLabel('Tüm Komutlar')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚'),
          new ButtonBuilder()
            .setCustomId('home_page')
            .setLabel('Ana Sayfa')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏠')
        );
    };

    // Kategori seçim menüsü
    const createSelectMenu = () => {
      const options = categoryKeys.map((key, index) => {
        // Emoji'yi güvenli şekilde al
        const emojiMap = {
          moderation: '🔨',
          admin: '⚙️',
          utility: '🔧'
        };
        const emoji = emojiMap[key] || '📌';
        
        return {
          label: categories[key].name.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim(),
          value: index.toString(),
          emoji: emoji,
          description: `${categories[key].commands.length} komut`
        };
      });

      return new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Kategori seçin...')
            .addOptions(options)
        );
    };

    const embed = createEmbed(currentPage);
    const buttons = createButtons(currentPage);
    const selectMenu = createSelectMenu();

    const msg = await message.reply({ 
      embeds: [embed], 
      components: [selectMenu, buttons] 
    });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Bu butonu sadece komutu kullanan kişi kullanabilir!`
          }],
          ephemeral: true
        });
      }

      if (interaction.customId === 'prev_page') {
        currentPage--;
        const newEmbed = createEmbed(currentPage);
        const newButtons = createButtons(currentPage);
        await interaction.update({ embeds: [newEmbed], components: [createSelectMenu(), newButtons] });
      } else if (interaction.customId === 'next_page') {
        currentPage++;
        const newEmbed = createEmbed(currentPage);
        const newButtons = createButtons(currentPage);
        await interaction.update({ embeds: [newEmbed], components: [createSelectMenu(), newButtons] });
      } else if (interaction.customId === 'home_page') {
        currentPage = 0;
        const newEmbed = createEmbed(currentPage);
        const newButtons = createButtons(currentPage);
        await interaction.update({ embeds: [newEmbed], components: [createSelectMenu(), newButtons] });
      } else if (interaction.customId === 'category_select') {
        const selectedValue = parseInt(interaction.values[0]);
        currentPage = selectedValue;
        const newEmbed = createEmbed(currentPage);
        const newButtons = createButtons(currentPage);
        await interaction.update({ embeds: [newEmbed], components: [createSelectMenu(), newButtons] });
      } else if (interaction.customId === 'all_commands') {
        const allCommandsEmbed = new EmbedBuilder()
          .setTitle('📚 Tüm Komutlar')
          .setColor(parseInt(config.colors.info.replace('#', ''), 16))
          .setDescription(`Prefix: \`${prefix}\`\n\n**Toplam:** ${Object.values(categories).reduce((sum, cat) => sum + cat.commands.length, 0)} komut\n\n${Object.entries(categories).map(([key, cat]) => {
            return `**${cat.name}**\n${cat.commands.map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n')}`;
          }).join('\n\n')}`)
          .setFooter({ text: `İsteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        await interaction.update({ embeds: [allCommandsEmbed], components: [] });
        collector.stop();
        return;
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
