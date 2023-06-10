const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-search')
    .setDescription('Performs a search action on the selected user.')
    .addStringOption(option => option.setName('username').setDescription('Perform player action, list their exact username (action).').setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: false });
      const username = interaction.options.getString('username');
      const roleName = 'Obelisk Permission';
      const guild = interaction.guild;
      const startTime = Date.now();

      const role = guild.roles.cache.find(r => r.name === roleName);
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

        return interaction.followUp({ embeds: [embed] });
      }

      const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
      const token = snapshot.get('token.stringValue');

      let iterationCount = 0;
      let success = 0;
      let playerObject = '';

      const url = `https://api.nitrado.net/services`;
      const response = await axios.get(url, { headers: { 'Authorization': token } });
      const servers = response.data.data.services;
      const total = servers.length;

      const requestPromise = servers.map(async obj => {
        try {
          const url = `https://api.nitrado.net/services/${obj.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          if (response.data.status === 'success') {
            success++;

            const playerInformation = response.data.data.players;
            for (const player of playerInformation) {
              if (player.name.includes(username) && iterationCount < 25) {
                iterationCount++;
                const playerOnline = player.online;
                const playerStatus = playerOnline ? 'Online' : 'Offline';

                const serverUrl = `https://api.nitrado.net/services/${obj.id}/gameservers`;
                const serverResponse = await axios.get(serverUrl, { headers: { 'Authorization': token } });
                const playerLocation = serverResponse.data.data.gameserver.query.server_name;

                playerObject += `\`🟢\` \`${playerStatus}\`\n\`🔗\` ${player.name}\n\`🔗\` ${playerLocation}\n\`🔗\` ${player.id}\n\n`;
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      });

      await Promise.all(requestPromise);
      const duration = Date.now() - startTime;

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
        .setDescription(`${playerObject}The search command was successful.\nScanned \`${success}\` of \`${total}\` servers.\nLimited \`25\` objects.`);

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
  },
};
