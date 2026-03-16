const { ModalSubmitInteraction } = require('discord.js');
const Guild = require('../models/Guild');
const config = require('../config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isModalSubmit() && interaction.customId === 'prefix_modal') {
      const newPrefix = interaction.fields.getTextInputValue('prefix_input');
      
      if (newPrefix.length > 5 || newPrefix.length < 1) {
        return interaction.reply({
          embeds: [{
            color: parseInt(config.colors.error.replace('#', ''), 16),
            description: `${config.emojis.error} Prefix 1-5 karakter arasında olmalıdır!`
          }],
          ephemeral: true
        });
      }

      const guildData = await Guild.findOne({ guildId: interaction.guild.id });
      guildData.prefix = newPrefix;
      await guildData.save();

      const successEmbed = {
        color: parseInt(config.colors.success.replace('#', ''), 16),
        title: '✅ Prefix Değiştirildi',
        description: `Bot prefix'i başarıyla \`${newPrefix}\` olarak ayarlandı!\n\nArtık komutları \`${newPrefix}help\` şeklinde kullanabilirsiniz.`,
        footer: { text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() },
        timestamp: new Date()
      };

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
  }
};
