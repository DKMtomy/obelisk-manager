const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

        if (interaction.customId === 'auto-maintenance') {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Pending Access Authorization**\nGrant permission to restart your services.\nDesigned to bring downed servers online.\n\n**Overview & Information**\nCreated to provide you a constant uptime.\nToggled Button: \`'Enable'\` - \`'Disable'\``);

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('auto-maintenance-enable')
                .setLabel('Enable Feature')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId('auto-maintenance-disable')
                .setLabel('Disable Feature')
                .setStyle(ButtonStyle.Secondary),
            );

          await interaction.followUp({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'auto-maintenance-enable') {
          const roleName = 'Obelisk Permission';
          const guild = interaction.guild;

          guild.roles.fetch().then(async roles => {
            const role = await roles.find(r => r.name === roleName);
            if (!role || !interaction.member.roles.cache.has(role.id)) {
              const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('`Obelisk Management`')
                .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

              return interaction.followUp({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`**Automated Maintenance**\nSet as: \`'True'\` auto restarts enabled.\nDowned servers will be pushed online.`);

            await interaction.followUp({ embeds: [embed] });

            await db.collection('discord-data').doc(interaction.guild.id)
              .set({ ['Server Status']: { autoMaintenance: true } }, { merge: true });
          });
        }

        if (interaction.customId === 'auto-maintenance-disable') {
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

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setDescription(`**Automated Maintenance**\nSet as: \`'False'\` auto restarts enabled.\nDowned servers will not be pushed online.`);

            await interaction.followUp({ embeds: [embed] });

            await db.collection('discord-data').doc(interaction.guild.id)
              .set({ ['Server Status']: { autoMaintenance: false } }, { merge: true });
          });
        }

        if (interaction.customId === 'cluster-action') {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Pending Access Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\n**Overview & Information**\nSelect: \`'Dismiss Message'\` to return.`);

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

          await interaction.followUp({ embeds: [embed], components: [row] });
        }


        if (interaction.customId === 'restart-cluster') {
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
              const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
              const token = snapshot._fieldsProto.token.stringValue;
              console.log(token);

              let success = 0;
              let total = 0;

              const url = `https://api.nitrado.net/services`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              const servers = response.data.data.services;
              total = servers.length;

              servers.forEach(async obj => {
                const url = `https://api.nitrado.net/services/${obj.id}/gameservers/restart`;
                const response = await axios.post(url, { message: 'Cluster-Wide Restart' }, { headers: { 'Authorization': token } });
                console.log(response.data.message);
                success++;
              });

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: 'Tip: Contact support if there are issues.' })
                .setDescription(`**Command Processing**\nExecuting your cluster-wide server action\nEverything has been returned properly.\nRestarting all servers.`);

              await interaction.followUp({ embeds: [embed] });

            } catch (error) {
              console.log(error);
              const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('`Obelisk Management`')
                .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

              return interaction.followUp({ embeds: [embed] });
            }
          });
        }

        if (interaction.customId === 'stop-cluster') {
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
              const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
              const token = snapshot._fieldsProto.token.stringValue;
              console.log(token);

              let success = 0;
              let total = 0;

              const url = `https://api.nitrado.net/services`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              const servers = response.data.data.services;
              total = servers.length;

              servers.forEach(async obj => {
                const url = `https://api.nitrado.net/services/${obj.id}/gameservers/stop`;
                const response = await axios.post(url, { message: 'Cluster-Wide Restart' }, { headers: { 'Authorization': token } });
                console.log(response.data.message);
                success++;
              });

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: 'Tip: Contact support if there are issues.' })
                .setDescription(`**Command Processing**\nExecuting your cluster-wide server action\nEverything has been returned properly.\nStopping all servers.`);

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
        }

      } catch (error) {
        console.log(error);
      }
    });
  },
};


