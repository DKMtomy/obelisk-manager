const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../src/script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const loop = async () => {
      const collectionReference = db.collection('discord-data');
      const snapshot = await collectionReference.get();
  
      for (const document of snapshot.docs) {
        try {
          const managementStatusMessage = document.get('Server Status.managementStatusMessage');
          const managementStatus = document.get('Server Status.managementStatus');
          const autoMaintenance = document.get('Server Status.autoMaintenance');
          const token = document.get('token');
  
          let output = '';
          let currentPlayers = 0;
          let maximumPlayers = 0;
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          const serviceInformation = response.data.data.services;
  
          const promiseArr = serviceInformation.slice(0, 20).map(service => {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            return axios.get(url, { headers: { 'Authorization': token } });
          });
  
          const gameserverRequests = await Promise.all(promiseArr);
  
          for (let i = 0; i < gameserverRequests.length; i++) {
            const gameserverInformation = gameserverRequests[i].data.data.gameserver;
            const gameserverStatus = gameserverRequests[i].data.data.gameserver.status;
  
            if (['arkxb', 'arkps', 'arkse', 'arkswitch'].includes(gameserverInformation.game)) {
              const suspendDate = serviceInformation[i].suspend_date;
              const unixTimestamp = new Date(suspendDate).getTime() / 1000;
  
              switch (gameserverStatus) {
                case 'started':
                  output += `\`🟢\` \`Service Online\`\n${gameserverInformation.query?.server_name || 'Gameserver API Outage'}\nPlayer Count: \`(${gameserverInformation.query?.player_current || '0'}/${gameserverInformation.query?.player_max || '0'})\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
                  currentPlayers += parseInt(gameserverInformation.query?.player_current || '0');
                  maximumPlayers += parseInt(gameserverInformation.query?.player_max || '0');
                  break;
  
                case 'restarting':
                case 'stopping':
                case 'updating':
                case 'stopped':
                  output += `\`🟠\` \`Service ${gameserverStatus.charAt(0).toUpperCase() + gameserverStatus.slice(1)}\`\n${gameserverInformation.settings.config["server-name"]}\nPlayer Count: \`(0/0)\`\nID: ||${gameserverInformation.service_id}||\n\n**Server Runtime**\n<t:${unixTimestamp}:f>\n\n`;
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
  
          const serviceMaintenance = async () => {
            for (const obj of serviceInformation) {
              const url = `https://api.nitrado.net/services/${obj.id}/gameservers`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              const currentStatus = response.data.data.gameserver.status;
  
              if (['arkxb', 'arkps', 'arkse', 'arkswitch'].includes(response.data.data.gameserver.game) && currentStatus === 'stopped') {
                const restartUrl = `https://api.nitrado.net/services/${obj.id}/gameservers/restart`;
                const restartResponse = await axios.post(restartUrl, { message: 'Obelisk Automated Restart' }, { headers: { 'Authorization': token } });
                console.log(restartResponse.data.message);
  
                const embed = new EmbedBuilder()
                  .setColor('#2ecc71')
                  .setTitle('`Obelisk Management`')
                  .setFooter({ text: 'Tip: Contact support if there are issues.\nOptional: Auto Server Maintenance.' })
                  .setDescription(`**Automatic Server Maintenance**\nCrashed server, brought back online.\nServer Identification #: \`${obj.id}\`\n<t:${unixTime}:f>`);
  
                await channel.send({ embeds: [embed] });
              }
            }
          };
  
          if (autoMaintenance) {
            await serviceMaintenance();
          }
  
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Server cap of 20 servers, for status display.\nTip: Contact support if there are issues.' })
            .setDescription(`${output} **Global Player Count:**\n \`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unixTime}:R>\n**[Partnership & Affiliation](https://pebblehost.com/)**\nWe host our service at Pebble-Host.\nGreat uptime and amazing cloud hosting!\n\n**Automatic Maintenance**\n${autoMaintenance ? `Set as: \`'True'\` auto restarts enabled.\nDowned servers will be pushed online.` : `Set as: \`'False'\` auto restarts disabled.\nDowned servers will not be pushed online.`}`)
            .setImage('https://i.imgur.com/y3UWJCV.png');
  
          await message.edit({ embeds: [embed], components: [row] });
          console.log('Status Refreshed');
        } catch (error) {
          console.log(error);
          continue;
        }
      }
      setTimeout(loop);
    };
  
    loop();
  },
};
