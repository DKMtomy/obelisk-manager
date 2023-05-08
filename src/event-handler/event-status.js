const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        try {
          const managementStatusMessage = document._fieldsProto['Server Status'].mapValue.fields.managementStatusMessage.stringValue;
          const managementStatus = document._fieldsProto['Server Status'].mapValue.fields.managementStatus.stringValue;
          const token = document._fieldsProto.token.stringValue;

          let output = '';
          let currentPlayers = 0;
          let maximumPlayers = 0;
          let url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          let serviceInformation = response.data.data.services;

          const promiseArr = serviceInformation.slice(0, 20).map(service => {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            return axios.get(url, { headers: { 'Authorization': token } });
          });

          const gameserverRequests = await Promise.all(promiseArr);

          for (let i = 0; i < gameserverRequests.length; i++) {
            let suspendDate = serviceInformation[i].suspend_date;
            let unixTimestamp = new Date(suspendDate).getTime() / 1000;
            const gameserverInformation = gameserverRequests[i].data.data.gameserver;
            const gameserverStatus = gameserverRequests[i].data.data.gameserver.status;

            if (gameserverRequests[i].data.data.gameserver.game === 'arkxb' || gameserverRequests[i].data.data.gameserver.game === 'arkps' || gameserverRequests[i].data.data.gameserver.game === 'arkse' || gameserverRequests[i].data.data.gameserver.game === 'arkswitch') {
              switch (gameserverStatus) {
                case 'started':
                  output += `\`🟢\` \`Service Online\`\n${gameserverInformation.query?.server_name || 'Gameserver API Outage'}\nPlayer Count: \`(${gameserverInformation.query?.player_current || '0'}/${gameserverInformation.query?.player_max || '0'})\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  currentPlayers += parseInt(gameserverInformation.query?.player_current || '0');
                  maximumPlayers += parseInt(gameserverInformation.query?.player_max || '0');
                  break;

                case 'restarting':
                  output += `\`🟠\` \`Service Restarting\`\n${gameserverInformation.settings.config["server-name"]}\nPlayer Count: \`(0/0)\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  break;

                case 'stopping':
                  output += `\`🟠\` \`Service Stopping\`\n${gameserverInformation.settings.config["server-name"]}\nPlayer Count: \`(0/0)\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  break;

                case 'updating':
                  output += `\`🟠\` \`Service Updating\`\n${gameserverInformation.settings.config["server-name"]}\nPlayer Count: \`(0/0)\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  break;

                case 'stopped':
                  output += `\`🔴\` \`Service Stopped\`\n${gameserverInformation.settings.config["server-name"]}\nPlayer Count: \`(0/0)\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  break;

                default:
                  break;
              }
            }
          }

          const channel = await client.channels.fetch(managementStatus);
          const message = await channel.messages.fetch(managementStatusMessage);
          const unixTime = Math.floor(Date.now() / 1000);

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('restart-cluster')
                .setLabel('Restart Cluster')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId('stop-cluster')
                .setLabel('Stop Cluster')
                .setStyle(ButtonStyle.Secondary),
            );

          let embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: `Tip: Contact support if there are issues.\nServer cap of 20 servers, for status display.` })
            .setDescription(`${output} **Global Player Count:**\n \`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unixTime}:R>\n**[Partnership & Affiliation](https://billing.sparkedhost.com/aff.php?aff=1925)**\nWe host our service at Sparked-Host.\nGreat uptime and amazing cloud hosting!`)
            .setImage('https://i.imgur.com/AkhEz26.png');

          await message.edit({ embeds: [embed], components: [row] });
          console.log('Status Refreshed');

        } catch (error) {
          continue;
        }
      }
      setTimeout(loop);
    }
    loop();
  },
};
