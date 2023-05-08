const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
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

        if (interaction.customId === 'restart-cluster') {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('yes-restart')
                .setLabel('Restart Cluster')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId('no-restart')
                .setLabel('Nevermind')
                .setStyle(ButtonStyle.Secondary),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`Do you want to perform this action?\nThis will execute for all servers!`);

          await interaction.followUp({ embeds: [embed], components: [row] });
          setTimeout(async () => {
            await interaction.deleteReply();
          }, 7500);
        }

        if (interaction.customId === 'stop-cluster') {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('yes-stop')
                .setLabel('Stop Cluster')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId('no-stop')
                .setLabel('Nevermind')
                .setStyle(ButtonStyle.Secondary),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`Do you want to perform this action?\nThis will execute for all servers!`);

          await interaction.followUp({ embeds: [embed], components: [row] });
          setTimeout(async () => {
            await interaction.deleteReply();
          }, 7500);
        }

        if (interaction.customId === 'no-restart' || interaction.customId === 'no-stop') {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`You've successfully canceled the action.`);

          await interaction.followUp({ embeds: [embed] });

          setTimeout(async () => {
            await interaction.deleteReply();
          }, 7500);
        }

        if (interaction.customId === 'yes-restart') {
          const roleName = 'Obelisk Permission';
          const guild = interaction.guild;

          guild.roles.fetch().then(async roles => {
            const role = roles.find(r => r.name === roleName);
            if (!role || !interaction.member.roles.cache.has(role.id)) {

              const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: `Tip: Contact support if there are issues.` })
                .setDescription('\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nEnsure you have the permission role. \nThe role is generated upon token setup.\nType \`/setup-help\` for more information.\n\nJoin [here](https://discord.gg/jee3ukfvVr "Obelisk Support Server") for staff support');

              await interaction.followUp({ embeds: [embed] });

              setTimeout(async () => {
                await interaction.deleteReply();
              }, 7500);

            } else {
              const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
              const token = snapshot._fieldsProto.token.stringValue;
              console.log(token);

              let success = 0;
              let total = 0;

              let url = `https://api.nitrado.net/services`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              let servers = response.data.data.services;
              total = servers.length;

              const requestPromise = servers.map(async obj => {
                try {
                  url = `https://api.nitrado.net/services/${obj.id}/gameservers/restart`;
                  const response = await axios.post(url, { message: 'Restarting' }, { headers: { 'Authorization': token } });
                  console.log(response.data);

                  if (response.data.status === 'success') {
                    success++;
                  }

                } catch (error) {
                  console.log(error);
                }
              });

              await Promise.all(requestPromise);
              const successPercent = (success / total) * 100;

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: 'Tip: Contact support if there are issues.' })
                .setDescription(`Restarting \`${success}\` of \`${total}\` servers. \`(${successPercent}%)\``);

              await interaction.followUp({ embeds: [embed] });

              setTimeout(async () => {
                await interaction.deleteReply();
              }, 7500);

            }
          });
        }

        if (interaction.customId === 'yes-stop') {
          const roleName = 'Obelisk Permission';
          const guild = interaction.guild;

          guild.roles.fetch().then(async roles => {
            const role = roles.find(r => r.name === roleName);
            if (!role || !interaction.member.roles.cache.has(role.id)) {

              const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: `Tip: Contact support if there are issues.` })
                .setDescription('\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nEnsure you have the permission role. \nThe role is generated upon token setup.\nType \`/setup-help\` for more information.\n\nJoin [here](https://discord.gg/jee3ukfvVr "Obelisk Support Server") for staff support');

              await interaction.followUp({ embeds: [embed] });

              setTimeout(async () => {
                await interaction.deleteReply();
              }, 7500);

            } else {
              const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
              const token = snapshot._fieldsProto.token.stringValue;
              console.log(token);

              let success = 0;
              let total = 0;

              let url = `https://api.nitrado.net/services`;
              const response = await axios.get(url, { headers: { 'Authorization': token } });
              let servers = response.data.data.services;
              total = servers.length;

              const requestPromise = servers.map(async obj => {
                try {
                  url = `https://api.nitrado.net/services/${obj.id}/gameservers/stop`;
                  const response = await axios.post(url, { message: 'Stopping' }, { headers: { 'Authorization': token } });
                  console.log(response.data);

                  if (response.data.status === 'success') {
                    success++;
                  }

                } catch (error) {
                  console.log(error);
                }
              });

              await Promise.all(requestPromise);
              const successPercent = (success / total) * 100;

              const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('`Obelisk Management`')
                .setFooter({ text: 'Tip: Contact support if there are issues.' })
                .setDescription(`Stopping  \`${success}\` of \`${total}\` servers. \`(${successPercent}%)\``);

              await interaction.followUp({ embeds: [embed] });

              setTimeout(async () => {
                await interaction.deleteReply();
              }, 7500);
            }
          });
        }

        if (interaction.customId === 'view-obelisk-premium') {

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Obelisk Premium & Installation**\nFor those interested in the premium version of our management bot, you'd receive a more optimized and advanced management system. The development and goal of this project were simple, to be the all-in-one utility tool needed to run your community. As well, we guarantee a high uptime or your money back.\n\n**Advanced Logging & Detection**\nWith everything you love and more, we now support forum and thread logging. From online player logging, admin logging, chat logging, etc. Currently implementing dupe protections, for console servers, logging players if they're located on two maps at once, as well as faster refresh rates, and more!\n\n\`💵\` \`$9.99/Mo\` - \`$12.99/Mo\`\n\`🔗\` Click [here](https://discord.gg/jee3ukfvVr) to join the server!\n\`🔗\` Click [here](https://discord.com/api/oauth2/authorize?client_id=1076319705599586354&permissions=8&scope=bot%20applications.commands) to invite the bot!\n\nExample: [Video-Demo](https://streamable.com/hys1yr)`);

          await interaction.followUp({ embeds: [embed], ephemeral: true });
        }

      } catch (error) {
        console.log(error);
      }

    });

  },
};


