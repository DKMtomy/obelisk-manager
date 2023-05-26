const { Events, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {
      const collectionReference = db.collection('discord-data');
      const snapshot = await collectionReference.get();

      for (const document of snapshot.docs) {
        const dupeProtection = document._fieldsProto['Server Protections']?.mapValue?.fields?.dupeProtection?.stringValue;
        const token = document._fieldsProto.token.stringValue;

        try {
          let total = 0;
          let current = 0;
          let onlinePlayers = [];
          let serverIdentification = [];
          let playersOnMultipleServers = [];

          const serversResponse = await axios.get('https://api.nitrado.net/services', { headers: { 'Authorization': token } });
          const servers = serversResponse.data.data.services;
          total = servers.length;

          await Promise.all(servers.map(async (server) => {
            try {
              const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              console.log(`Server: ${server.id}`);
              current++;

              const onlinePlayersServer = response.data.data.players
                .filter(player => player.online)
                .map(player => ({ id: player.id, name: player.name }));

              onlinePlayers.push(...onlinePlayersServer);
              serverIdentification.push(server.id);

            } catch (error) {
              console.error(error);
            }
          }));

          console.log(serverIdentification);
          serverIdentification.forEach(obj => console.log(obj));

          const playersById = {};
          onlinePlayers.forEach(player => {
            if (playersById[player.id]) {
              playersOnMultipleServers.push(player);
            } else {
              playersById[player.id] = true;
            }
          });

          let playerInformation = '';
          if (playersOnMultipleServers.length > 0) {
            const promises = playersOnMultipleServers.map(async player => {
              console.log(`ID: ${player.id}, Name: ${player.name}`);

              const playerServers = serverIdentification.map(async server => {
                const url = `https://api.nitrado.net/services/${server}/gameservers/games/players`;
                const response = await axios.get(url, { headers: { 'Authorization': token } });
                const currentPlayers = response.data.data.players;

                currentPlayers.filter(obj => obj.online).forEach(obj => {
                  if (obj.id === player.id) {
                    console.log(obj);

                    playerInformation += `\n\`🟢\` \`Player Online\`\n\`🔗\` ${player.name}\n\`🔗\` ${player.id}\n`;

                  }
                });
              });

              await Promise.all(playerServers);
            });

            await Promise.all(promises);

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`Player located on servers at once.\nPossible duping in progress...\n${playerInformation}\nThe search event was successful.\nScanned \`${current}\` of \`${total}\` servers.\nLimited \`2\` objects.`);

            const channel = await client.channels.fetch(dupeProtection);
            await channel.send({ embeds: [embed] });
          }

        } catch (error) {
          console.log(error);
          continue;
        }
      }
      setTimeout(loop, 7500);
    }
    // loop();
  },
};