const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-stop')
    .setDescription('Performs a stop action on the selected server.')
    .addStringOption(option => option.setName('identification').setDescription('Perform server action, list the exact identification number (action).').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('Enter the stop message (security).').setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: false });
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

        const startTime = performance.now();
        const identification = interaction.options.getString('identification');
        const message = interaction.options.getString('message');

        try {
          const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
          const serverLogging = snapshot._fieldsProto['Server Protections']?.mapValue?.fields?.serverLogging?.stringValue;
          const token = snapshot._fieldsProto?.token?.stringValue;

          const url = `https://api.nitrado.net/services/${identification}/gameservers/stop`;
          const response = await axios.post(url, { message: message }, { headers: { 'Authorization': token } });
          console.log(response.data.message);

          if (response.data.status === 'success') {
            try {
              const unixTime = Math.floor(Date.now() / 1000);

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: `Tip: Contact support if there are issues.` })
                .setDescription(`\`🟢\` \`System Success\`\nThis server has been stopped.\nStopped by <@${admin}>\n\n<t:${unixTime}:f>\nIdentification #: \`${identification}\`\nReason: \`${message}\``);

              const channel = await interaction.client.channels.fetch(serverLogging);
              await channel.send({ embeds: [embed] });

            } catch (error) {
              console.log(`Server Logging does not exist: ${interaction.guild.name}`);
            }
          }

          const duration = performance.now() - startTime;

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
            .setDescription(`\`🟢\` \`System Success\`\nThe selected server has been stopped!\n\n**Announcement Message**\n\`${message}\``);

          await interaction.followUp({ embeds: [embed] });

        } catch (error) {
          console.log(error);
          const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`\`🟠\` \`System Failure\`\nFirebase cannot find a token on this guild.\nPlease ensure you've linked your token.\nExecute: \`'/setup-token'\`\n\n**Troubleshooting & Solution**\nReconnect your token to our database.\nWith each update, they are cleared.`);

          await interaction.followUp({ embeds: [embed] });
        }
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

