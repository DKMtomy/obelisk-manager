const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-history')
    .setDescription('Performs a history action on the selected user.')
    .addStringOption(option => option.setName('username').setDescription('Perform player action, list their exact username (action).').setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: false });
      const username = interaction.options.getString('username');
      const roleName = 'Obelisk Permission';
      const guild = interaction.guild;

      guild.roles.fetch().then(async roles => {
        const role = roles.find(r => r.name === roleName);
        if (!role || !interaction.member.roles.cache.has(role.id)) {
          const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

          return interaction.followUp({ embeds: [embed] });
        }

        let localBanAdmin = '';
        let localBanReason = '';
        const startTime = performance.now();
        const localSnapshot = await db.collection('player-data').doc(interaction.guild.id).get();

        try {
          localBanAdmin = localSnapshot._fieldsProto[username].mapValue.fields.admin.stringValue;
          localBanReason = localSnapshot._fieldsProto[username].mapValue.fields.reason.stringValue;

        } catch (error) {
          const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`\`🟠\` \`System Failure\`\nThe player you searched for cannot be found.\nThis user is not banned on your server.\n\n**Troubleshooting & Solution**\nThe username searched is case-sensitive.\nEnsure you've spelled their tag correctly.`);

          interaction.followUp({ embeds: [embed] });
          return;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
          .setDescription(`\`🟢\` \`System Success\`\nPlayer information has been retrieved. \nPlayer history will be shown below.\n\n**Server-Related Information**\nThis user is banned from your server.\nBelow is their most recent ban offense.\nBanned by <@${localBanAdmin}>\n\nReason: \`${localBanReason}\``);

        await interaction.followUp({ embeds: [embed] });

      });

    } catch (error) {
      console.log(error);
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('`Obelisk Management`')
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setDescription(`\`🟠\` \`System Failure\`\nFirebase cannot find a token on this guild.\nPlease ensure you've linked your token.\nExecute: \`'/setup-token'\`\n\n**Troubleshooting & Solution**\nReconnect your token to our database.\nWith each update, they are cleared.`);

      await interaction.followUp({ embeds: [embed] });
    }
  },
};
