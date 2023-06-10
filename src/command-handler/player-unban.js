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

      const role = guild.roles.cache.find(r => r.name === roleName);
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

        return interaction.followUp({ embeds: [embed] });
      }

      const startTime = Date.now();
      const username = interaction.options.getString('username');
      const admin = interaction.user.id;

      const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
      const unbanLogging = snapshot.get('Server Protections.unbanLogging.stringValue');
      const token = snapshot.get('token.stringValue');

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

          if (response.data.status === 'success') {
            success++;

            if (success === 1) {
              const unixTime = Math.floor(Date.now() / 1000);

              await db.collection('player-data').doc(interaction.guild.id).set({ [username]: FieldValue.delete() }, { merge: true });

              try {
                const embed = new EmbedBuilder()
                  .setColor('#2ecc71')
                  .setTitle('`Obelisk Management`')
                  .setFooter({ text: 'Tip: Contact support if there are issues.' })
                  .setDescription(`\`🟢\` \`System Success\`\nThis user is unbanned from your server.\nUnbanned by <@${admin}>\n\n<t:${unixTime}:f>\nIdentifier: \`${username}\``);

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
      const duration = Date.now() - startTime;

      const embed = new EmbedBuilder()
        .setTitle('`Obelisk Management`')
        .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${Math.trunc(duration)}ms.` })
        .setDescription(`\`${success >= total / 2 ? '🟢' : '🟠'}\` \`${success >= total / 2 ? 'System Success' : 'System Failure'}\`\nThe selected user has been ${success >= total / 2 ? 'unbanned' : 'not unbanned'}!\nUnbanned on \`${success}\` of \`${total}\` servers.\nIdentifier: \`${username}\``);

      const emoji = success >= total / 2 ? '1086427881418280960' : '1086425533161685093';

      await interaction.followUp({ embeds: [embed] });
      const message = await interaction.fetchReply();
      await message.react(emoji);

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
