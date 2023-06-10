const { SlashCommandBuilder, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-help')
    .setDescription('Setup process for your bot.'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: false });

      const menu = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('select')
            .setPlaceholder('View here for bot information!')
            .addOptions([
              {
                label: '🍻 Bot Installation & Setup',
                description: 'Information regarding installation.',
                value: 'first_option',
              },
            ]),
        );

      const button = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setURL('https://discord.gg/jee3ukfvVr')
            .setLabel('Support Server')
            .setStyle('LINK')
            .setEmoji('1086427881418280960'),
        );

      const embed = new MessageEmbed()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setFooter('Tip: Contact support if there are issues.')
        .setDescription(`**Obelisk Information & Overview**\nThe complete utility bot for managing your \`'Ark Survival Evolved'\` gameservers, across all platforms. Holding the highest uptime, backed by hundreds of clusters and well-known content creators. All your data is secured and encrypted through **[Firebase](https://firebase.google.com/ "Firebase Cloud Hosting")**, where we managed millions of data, provided by users. \n\n**[Partnership & Affiliation](https://billing.sparkedhost.com/aff.php?aff=1925 "Sparked-Host Affiliate Link")**\nWe're pleased to announce our official partnership with Sparked-Host! We've been using their service for some time, after transferring our containers over. Since the switch, our bots have been working flawlessly.\n\n**Additional Information**\nSpeaking to all developers, their cloud hosting is simply the best that I've worked with, with an amazing interface and outstanding uptime. They offer game hosting as well, at a great price.\n\n\`🍻\` ||https://sparkedhost.com/||`);

      await interaction.followUp({ embeds: [embed], components: [menu, button] });

    } catch (error) {
      console.warn(error);
    }
  },
};
