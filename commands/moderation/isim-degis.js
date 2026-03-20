const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'isim-degiş',
  description: 'Kullanıcının sunucu ismini değiştirir',
  aliases: ['isim', 'nick', 'nickname', 'isimdeğiş'],
  cooldown: 5,
  async execute(message, args, client, guildData) {
    if (!message.member.permissions.has('ManageNicknames')) {
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          description: `${config.emojis.error} Bu komutu kullanmak için **Nicknameler Yönet** yetkisi gerekli!`
        }]
      });
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      const prefix = guildData?.prefix || 'g!';
      return message.reply({
        embeds: [{
          color: parseInt(config.colors.error.replace('#', ''), 16),
          title: '❌ Hatalı Kullanım',
          description: [
            `**Kullanım:** \`${prefix}isim-degis @kullanıcı <yeni isim>\``,
            `**Sıfırlamak için:** \`${prefix}isim-degis @kullanıcı sıfırla\``,
            '',
            `**Örnek:** \`${prefix}isim-degis @Ahmet Yeni İsim\``
          ].join('\n')
        }]
      });
    }

    if (target.id === client.user.id) {
      return message.reply({
        embeds: [{ color: parseInt(config.colors.error.replace('#', ''), 16), description: `${config.emojis.error} Kendi ismimi değiştiremezsin!` }]
      });
    }

    if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply({
        embeds: [{ color: parseInt(config.colors.error.replace('#', ''), 16), description: `${config.emojis.error} Bu kullanıcının rolü seninkinden yüksek veya eşit, ismini değiştiremezsin!` }]
      });
    }

    const newNick = args.slice(1).join(' ').trim();
    const isReset = !newNick || newNick.toLowerCase() === 'sıfırla' || newNick.toLowerCase() === 'sifirla' || newNick.toLowerCase() === 'reset';
    const finalNick = isReset ? null : newNick;

    if (!isReset && newNick.length > 32) {
      return message.reply({
        embeds: [{ color: parseInt(config.colors.error.replace('#', ''), 16), description: `${config.emojis.error} İsim en fazla **32 karakter** olabilir! (${newNick.length}/32)` }]
      });
    }

    const oldNick = target.nickname || target.user.username;

    // Onay embed'i
    const confirmEmbed = new EmbedBuilder()
      .setAuthor({ name: '✏️  İsim Değiştirme Onayı', iconURL: message.author.displayAvatarURL() })
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription('Aşağıdaki değişikliği onaylıyor musun?')
      .addFields(
        { name: '👤  Kullanıcı', value: `${target} \`(${target.id})\``, inline: false },
        { name: '📝  Eski İsim', value: `\`${oldNick}\``, inline: true },
        { name: '✨  Yeni İsim', value: isReset ? '`Sıfırlandı (orijinal isim)`' : `\`${finalNick}\``, inline: true },
        { name: '👑  Yetkili', value: `${message.author}`, inline: false }
      )
      .setColor(0xFAA61A)
      .setFooter({ text: '30 saniye içinde onaylamazsan iptal edilir.' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nick_confirm')
        .setLabel('Onayla')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('nick_cancel')
        .setLabel('İptal')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    const msg = await message.reply({ embeds: [confirmEmbed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000,
      max: 1
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'nick_cancel') {
        const cancelEmbed = new EmbedBuilder()
          .setDescription('❌ İsim değiştirme işlemi iptal edildi.')
          .setColor(parseInt(config.colors.error.replace('#', ''), 16));
        return interaction.update({ embeds: [cancelEmbed], components: [] });
      }

      // Onayla
      try {
        await target.setNickname(finalNick, `İsim değiştirildi | Yetkili: ${message.author.tag}`);

        const successEmbed = new EmbedBuilder()
          .setAuthor({ name: '✅  İsim Başarıyla Değiştirildi', iconURL: message.author.displayAvatarURL() })
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: '👤  Kullanıcı', value: `${target} \`(${target.id})\``, inline: false },
            { name: '📝  Eski İsim', value: `\`${oldNick}\``, inline: true },
            { name: '✨  Yeni İsim', value: isReset ? `\`${target.user.username}\` (sıfırlandı)` : `\`${finalNick}\``, inline: true },
            { name: '👑  Yetkili', value: `${message.author}`, inline: false }
          )
          .setColor(parseInt(config.colors.success.replace('#', ''), 16))
          .setFooter({ text: `Yetkili: ${message.author.tag}` })
          .setTimestamp();

        const resetRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`nick_reset_${target.id}`)
            .setLabel('İsmi Sıfırla')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄')
        );

        await interaction.update({ embeds: [successEmbed], components: isReset ? [] : [resetRow] });

        // Log kanalına gönder
        if (guildData?.moderationLogChannel) {
          const logChannel = message.guild.channels.cache.get(guildData.moderationLogChannel);
          if (logChannel) {
            await logChannel.send({
              embeds: [new EmbedBuilder()
                .setAuthor({ name: '✏️  İsim Değiştirildi', iconURL: target.user.displayAvatarURL() })
                .addFields(
                  { name: 'Kullanıcı', value: `${target.user.tag} \`(${target.id})\``, inline: true },
                  { name: 'Yetkili', value: `${message.author.tag} \`(${message.author.id})\``, inline: true },
                  { name: 'Eski İsim', value: `\`${oldNick}\``, inline: true },
                  { name: 'Yeni İsim', value: isReset ? `\`${target.user.username}\` (sıfırlandı)` : `\`${finalNick}\``, inline: true }
                )
                .setColor(parseInt(config.colors.info.replace('#', ''), 16))
                .setTimestamp()
              ]
            }).catch(() => {});
          }
        }

      } catch (err) {
        const errEmbed = new EmbedBuilder()
          .setDescription(`${config.emojis.error} İsim değiştirilemedi! Yetkim yetersiz olabilir.\n\`${err.message}\``)
          .setColor(parseInt(config.colors.error.replace('#', ''), 16));
        await interaction.update({ embeds: [errEmbed], components: [] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setDescription('⏰ Süre doldu, işlem iptal edildi.')
          .setColor(parseInt(config.colors.warning.replace('#', ''), 16));
        msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
