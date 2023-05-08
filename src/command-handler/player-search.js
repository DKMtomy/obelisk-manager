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

      guild.roles.fetch().then(async roles => {
        const role = roles.find(r => r.name === roleName);
        if (!role || !interaction.member.roles.cache.has(role.id)) {
          const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

          return interaction.followUp({ embeds: [embed] });
        }

        try {
          const startTime = performance.now();
          const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
          const token = snapshot._fieldsProto?.token?.stringValue;

          let iterrationCount = 0;
          let success = 0;

          const url = `https://api.nitrado.net/services`;
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          const servers = response.data.data.services;
          const total = servers.length;

          let playerObject = '';
          const requestPromise = servers.map(async obj => {
            try {
              const url = `https://api.nitrado.net/services/${obj.id}/gameservers/games/players`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              if (response.data.status === 'success') {
                success++;

                const playerInformation = response.data.data.players;
                playerInformation.forEach(async player => {

                  if (player.name.includes(username)) {
                    iterrationCount++;
                    console.log(iterrationCount);
                    if (player.online && iterrationCount <= 25) {
                      console.log(player.online, player.name);
                      const url = `https://api.nitrado.net/services/${obj.id}/gameservers`;
                      const response = await axios.get(url, { headers: { 'Authorization': token } });
                      playerLocation = response.data.data.gameserver.query.server_name;

                      playerObject += `\`🟢\` \`Player Online\`\n\`🔗\` ${player.name}\n\`🔗\` ${playerLocation}\n\`🔗\` ${player.id}\n\n`;
                    }

                    if (!player.online && iterrationCount <= 25) {
                      console.log(player.online, player.name);
                      const url = `https://api.nitrado.net/services/${obj.id}/gameservers`;
                      const response = await axios.get(url, { headers: { 'Authorization': token } });
                      playerLocation = response.data.data.gameserver.query.server_name;

                      playerObject += `\`🟠\` \`Player Offline\`\n\`🔗\` ${player.name}\n\`🔗\` ${playerLocation}\n\`🔗\` ${player.id}\n\n`;
                    }
                  }
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

              }
            } catch (error) {
              console.log(error);
            }

          });

          await Promise.all(requestPromise);
          const duration = performance.now() - startTime;

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
