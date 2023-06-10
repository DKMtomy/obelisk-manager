const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-whitelist')
    .setDescription('Performs a whitelist action on the selected user.')
    .addStringOption(option => option.setName('username').setDescription('Perform player action, list their exact username (action).').setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: false });
      const roleName = 'Obelisk Permission';
      const guild = interaction.guild;
      const startTime = Date.now();

      const role = guild.roles.cache.find(r => r.name === roleName);
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${roleName}\` is required.\nThe role is generated upon token setup.`);

        return interaction.followUp({ embeds: [embed] });
      }

      const username = interaction.options.getString('username');
      const snapshot = await db.collection('discord-data').doc(interaction.guild.id).get();
      const token = snapshot.get('token');

      const url = 'https://api.nitrado.net/services';
      const response = await axios.get(url, { headers: { 'Authorization': token } });
      const servers = response.data.data.services;
      const total = servers.length;

      let success = 0;
      const requestPromise = servers.map(async obj => {
        try {
          const url = `https://api.nitrado.net/services/${obj.id}/gameservers/games/whitelist`;
          const response = await axios.post(url, { identifier: username }, { headers: { 'Authorization': token } });

          if (response.data.status === 'success') {
            success++;
          }

        } catch (error) {
          console.log(error);
        }
      });

      await Promise.all(requestPromise);
      const duration = Date.now() - startTime;

      let emoji = '1086425533161685093';
      if (success >= total / 2) {
        emoji = '1086427881418280960';
      }

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${duration}ms.` })
        .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been whitelisted!\nWhitelisted on \`${success}\` of \`${total}\` servers.\nIdentifier: \`${username}\``);

      if (success < total / 2) {
        embed.setColor('#e67e22');
        embed.setTitle('`Obelisk Management`');
        embed.setFooter({ text: `Tip: Contact support if there are issues.\nPerformance response: ${duration}ms.` });
        embed.setDescription(`\`🟠\` \`System Failure\`\nThe selected user has not been whitelisted!\nWhitelisted on \`${success}\` of \`${total}\` servers.\nIdentifier: \`${username}\``);
      }

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
