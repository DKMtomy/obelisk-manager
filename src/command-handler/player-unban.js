const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unban')
    .setDescription('Performs an unban action on the selected user.')
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
          const admin = interaction.user.id;

          const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
          const unbanLogging = snapshot._fieldsProto['Server Protections']?.mapValue?.fields?.unbanLogging?.stringValue;
          const token = snapshot._fieldsProto?.token?.stringValue;

          let success = 0;
          let total = 0;
          const url = `https://api.nitrado.net/services`;
          const response = await axios.get(url, { headers: { 'Authorization': token } });
          const servers = response.data.data.services;
          total = servers.length;

          const requestPromise = servers.map(async obj => {
            try {
              const url = `https://api.nitrado.net/services/${obj.id}/gameservers/games/banlist`;
              const response = await axios.delete(url, { headers: { 'Authorization': token }, data: { identifier: username } });
              console.log(response.data);
              if (response.data.status === 'success') {
                success++;

                if (success === 1) {
                  const unixTime = Math.floor(Date.now() / 1000);

                  await db.collection('player-data').doc(interaction.guild.id)
                    .set({ [username]: FieldValue.delete() }, { merge: true });

                  try {
                    const embed = new EmbedBuilder()
                      .setColor('#2ecc71')
                      .setTitle('`Obelisk Management`')
                      .setFooter({ text: `Tip: Contact support if there are issues.` })
                      .setDescription(`\`🟢\` \`System Success\`\nThis user is unbanned from your server.\nUnbanned by <@${admin}>\n\n<t:${unixTime}:f>\nIdentifier: \`'${username}'\``);

                    const channel = await interaction.client.channels.fetch(unbanLogging);
                    await channel.send({ embeds: [embed] });

                  } catch (error) {
                    console.log(`Unban Logging does not exist: ${interaction.guild.name}`);
                  }
                }
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
              .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been unbanned!\nUnbanned on \`'${success}'\` of \`'${total}'\` servers.\nIdentifier: \`'${username}'\``);

            await interaction.followUp({ embeds: [embed] });
            const message = await interaction.fetchReply();
            await message.react('1086427881418280960');

          } else {
            const embed = new EmbedBuilder()
              .setColor('#e67e22')
              .setTitle('`Obelisk Management`')
              .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
              .setDescription(`\`🟠\` \`System Failure\`\nThe selected user has not been unbanned!\nUnbanned on \`'${success}'\` of \`'${total}'\` servers.\nIdentifier: \`'${username}'\``);

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