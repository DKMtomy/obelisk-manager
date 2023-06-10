const { Events, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { db } = require('../src/script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {
      try {
        if (!interaction.isButton()) return;
        await interaction.deferReply({ ephemeral: true });

        const roleName = 'Obelisk Permission';
        const guild = interaction.guild;
        const roles = await guild.roles.fetch();
        const role = roles.cache.find(r => r.name === roleName);

        if (!role || !interaction.member.roles.cache.has(role.id)) {
          const embed = new MessageEmbed()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

          return interaction.followUp({ embeds: [embed] });
        }

        if (interaction.customId === 'auto-maintenance') {
          const embed = new MessageEmbed()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter('Tip: Contact support if there are issues.')
            .setDescription(`**Pending Access Authorization**\nGrant permission to restart your services.\nDesigned to bring downed servers online.\n\n**Overview & Information**\nCreated to provide you a constant uptime.\nToggled Button: \`'Enable'\` - \`'Disable'\``);

          const row = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('auto-maintenance-enable')
                .setLabel('Enable Feature')
                .setStyle('SUCCESS'),

              new MessageButton()
                .setCustomId('auto-maintenance-disable')
                .setLabel('Disable Feature')
                .setStyle('SECONDARY')
            );

          await interaction.followUp({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'auto-maintenance-enable' || interaction.customId === 'auto-maintenance-disable') {
          const autoMaintenance = interaction.customId === 'auto-maintenance-enable';
          const embed = new MessageEmbed()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter('Tip: Contact support if there are issues.')
            .setDescription(`**Automated Maintenance**\nSet as: \`${autoMaintenance}\` auto restarts enabled.\nDowned servers ${autoMaintenance ? 'will' : 'will not'} be pushed online.`);

          await interaction.followUp({ embeds: [embed] });

          await db.collection('discord-data').doc(interaction.guild.id)
            .set({ ['Server Status']: { autoMaintenance } }, { merge: true });
        }

        if (interaction.customId === 'cluster-action') {
          const embed = new MessageEmbed()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter('Tip: Contact support if there are issues.')
            .setDescription(`**Pending Access Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\n**Overview & Information**\nSelect: \`'Dismiss Message'\` to return.`);

          const row = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('restart-cluster')
                .setLabel('Restart Cluster')
                .setStyle('SUCCESS'),

              new MessageButton()
                .setCustomId('stop-cluster')
                .setLabel('Stop Cluster')
                .setStyle('SECONDARY')
            );

          await interaction.followUp({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'restart-cluster' || interaction.customId === 'stop-cluster') {
          const clusterAction = interaction.customId === 'restart-cluster' ? 'restart' : 'stop';

          try {
            const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
            const token = snapshot.get('token');
            console.log(token);

            const url = `https://api.nitrado.net/services`;
            const response = await axios.get(url, { headers: { 'Authorization': token } });
            const servers = response.data.data.services;

            for (const obj of servers) {
              const actionUrl = `https://api.nitrado.net/services/${obj.id}/gameservers/${clusterAction}`;
              await axios.post(actionUrl, { message: 'Cluster-Wide Action' }, { headers: { 'Authorization': token } });
              console.log(response.data.message);
            }

            const embed = new MessageEmbed()
              .setColor('#2ecc71')
              .setTitle('`Obelisk Management`')
              .setFooter('Tip: Contact support if there are issues.')
              .setDescription(`**Command Processing**\nExecuting your cluster-wide server action\nEverything has been returned properly.\n${clusterAction === 'restart' ? 'Restarting' : 'Stopping'} all servers.`);

            await interaction.followUp({ embeds: [embed] });

          } catch (error) {
            console.log(error);
            const embed = new MessageEmbed()
              .setColor('#e67e22')
              .setTitle('`Obelisk Management`')
              .setFooter('Tip: Contact support if there are issues.')
              .setDescription(`\`🟠\` \`System Failure\`\n${error.response ? error.response.data.error.message : 'An error occurred while processing the action.'}\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

            await interaction.followUp({ embeds: [embed] });
          }
        }

      } catch (error) {
        console.log(error);
      }
    });
  },
};
