const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../src/script');
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
          const autoMaintenance = document._fieldsProto['Server Status']?.mapValue?.fields?.autoMaintenance?.booleanValue;
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
                .setCustomId('auto-maintenance')
                .setLabel('Auto Maintenance')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId('cluster-action')
                .setLabel('Cluster Action')
                .setStyle(ButtonStyle.Secondary),
            );

          serviceMaintenance = async () => {
            serviceInformation.forEach(async obj => {
              const url = `https://api.nitrado.net/services/${obj.id}/gameservers`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              const currentStatus = response.data.data.gameserver.status;

              if ((response.data.data.gameserver.game === 'arkxb' || response.data.data.gameserver.game === 'arkps' || response.data.data.gameserver.game === 'arkse' || response.data.data.gameserver.game === 'arkswitch') && currentStatus === 'stopped') {
                const url = `https://api.nitrado.net/services/${obj.id}/gameservers/restart`;
                const response = await axios.post(url, { message: 'Obelisk Automated Restart' }, { headers: { 'Authorization': token } });
                console.log(response.data.message);

                const embed = new EmbedBuilder()
                  .setColor('#2ecc71')
                  .setTitle('`Obelisk Management`')
                  .setFooter({ text: `Tip: Contact support if there are issues.\nOptional: Auto Server Maintenance.` })
                  .setDescription(`**Automatic Server Maintenance**\nCrashed server, brought back online.\nServer Identifiaction #: \`${obj.id}\`\n<t:${unixTime}:f>`)

                await channel.send({ embeds: [embed] })
              }
            });
          };

          autoMaintenance ? serviceMaintenance() : null;

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: `Server cap of 20 servers, for status display.\nTip: Contact support if there are issues.` })
            .setDescription(`${output} **Global Player Count:**\n \`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unixTime}:R>\n**[Partnership & Affiliation](https://pebblehost.com/)**\nWe host our service at Pebble-Host.\nGreat uptime and amazing cloud hosting!\n\n**Automatic Maintenance**\n${autoMaintenance ? `Set as: \`'True'\` auto restarts enabled.\nDowned servers will be pushed online.` : `Set as: \`'False'\` auto restarts disabled.\nDowned servers will not be pushed online.`}`)
            .setImage('https://i.imgur.com/y3UWJCV.png')

          await message.edit({ embeds: [embed], components: [row] });
          console.log('Status Refreshed');

        } catch (error) {
          console.log(error);
          continue;
        }
      }
      setTimeout(loop);
    }
    loop();
  },
};
