const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-whitelist')
    .setDescription('Performs an whitelist action on the selected user.')
    .addStringOption(option => option.setName('username').setDescription('Perform player action, list their exact username (action).').setRequired(true)),

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

        try {
          const startTime = performance.now();
          const username = interaction.options.getString('username');
          const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
          const token = snapshot._fieldsProto?.token?.stringValue;

          let success = 0;
          const url = `https://api.nitrado.net/services`;
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          const servers = response.data.data.services;
          const total = servers.length;

          const requestPromise = servers.map(async obj => {
            try {
              const url = `https://api.nitrado.net/services/${obj.id}/gameservers/games/whitelist`;
              const response = await axios.post(url, { identifier: username }, { headers: { 'Authorization': token } });
              console.log(response.data);

              if (response.data.status === 'success') {
                success++;
              }

            } catch (error) {
              console.log(error);
            }
          });

          await Promise.all(requestPromise);
          const duration = performance.now() - startTime;

          if (success >= total / 2) {
            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
              .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been whitelisted!\nWhitelisted on \`'${success}'\` of \`'${total}'\` servers.\nIdentifier: \`'${username}'\``);

            await interaction.followUp({ embeds: [embed] });
            const message = await interaction.fetchReply();
            await message.react('1086427881418280960');

          } else {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
              .setDescription(`\`🟠\` \`System Failure\`\nThe selected user has not been whitelisted!\nWhitelisted on \`'${success}'\` of \`'${total}'\` servers.\nIdentifier: \`'${username}'\``);

            await interaction.followUp({ embeds: [embed] });
            const message = await interaction.fetchReply();
            await message.react('1086425533161685093');
          }

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