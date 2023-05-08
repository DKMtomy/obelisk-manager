const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-token')
    .setDescription('Setup your token, will allow our bot to connect to your servers.')
    .addStringOption(option => option.setName('token').setDescription('Enter your server token, will be stored in our Firebase database.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const token = interaction.options.getString('token');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      let embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('`Obelisk Management`')
        .setFooter({ text: `Tip: Contact support if there are issues.` })
        .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.`);

      return interaction.followUp({ embeds: [embed] });
    }

    try {
      let embed;
      const url = 'https://oauth.nitrado.net/token';
      const serverResponse = await axios.get(url, { headers: { 'Authorization': token } });
      const tokenInformation = serverResponse.data.data.token;
      console.log(tokenInformation);

      const roleName = 'Obelisk Permission';
      const guild = interaction.guild;

      try {
        const roles = await guild.roles.fetch();
        const rolesArray = roles.filter(role => role.name === roleName);
        await Promise.all(rolesArray.map(async role => await role.delete()));

      } catch (error) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription(`\`🟠\` \`System Failure\`\nThere was an issue deleting a role.\nEnsure the bot has higher priority.\nRole: \`'Obelisk Permission'\``);

        return interaction.followUp({ embeds: [embed] });
      }

      if (tokenInformation.scopes.includes('service')) {
        const url = `https://api.nitrado.net/services`;
        const response = await axios.get(url, { headers: { 'Authorization': token } });
        const servers = response.data.data.services;
        const total = servers.length;

        if (total > 40) {
          const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('`Obelisk Management`')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`\`🟠\` \`System Failure\`\nUnfortunately, the token is not supported!\nWe can only support \`'40'\` active servers.\n\n**Troubleshooting & Solution**\nContact the [developer](https://discord.gg/jee3ukfvVr) for a bot container.\nContainers support \`'250'\` active servers.\nThis is done to allocate fair resources.`);

          return interaction.followUp({ embeds: [embed] });
        }

        const roleManagement = await interaction.guild.roles.create({
          name: 'Obelisk Permission',
          color: '#ffffff',
        });

        const categoryManagement = await interaction.guild.channels.create({
          name: `Obelisk Management`,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            },
            {
              id: roleManagement,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
            }
          ],
        });

        const managementLogs = await interaction.guild.channels.create({
          name: '⚫│𝗖ommand-𝗟ogs',
          type: ChannelType.GuildText,
          parent: categoryManagement,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription('`🟢` `System Success`\nEverything has been setup correctly.\nThe channel is setting in our database.\n\n**Channel Description**\nEnter all \`\'/\'\` commands here.\nDesigned for organization.');

        await managementLogs.send({ embeds: [embed] });

        const managementStatus = await interaction.guild.channels.create({
          name: '⚫│𝗦erver-𝗦tatus',
          type: ChannelType.GuildText,
          parent: categoryManagement,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription(`\`🟢\` \`System Success\`\nEverything has been setup correctly.\nThe channel is setting in our database.`);

        const managementStatusMessage = await managementStatus.send({ embeds: [embed] });

        const categoryProtection = await interaction.guild.channels.create({
          name: `Obelisk Protection`,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
            },
            {
              id: roleManagement,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            }
          ],
        });

        const dupeProtection = await interaction.guild.channels.create({
          name: '🍻│𝗗upe-𝗣rotection',
          type: ChannelType.GuildText,
          parent: categoryProtection,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription('`🟢` `System Success`\nEverything has been setup correctly.\nThe channel is setting in our database.\n\n**Channel Description**\nPlayers duping will be logged here.\nDesigned for Xbox servers only.');

        await dupeProtection.send({ embeds: [embed] });

        const serverLogging = await interaction.guild.channels.create({
          name: '🍻│𝗦erver-𝗟ogging',
          type: ChannelType.GuildText,
          parent: categoryProtection,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription("`🟢` `System Success`\nEverything has been setup correctly.\nThe channel is setting in our database.\n\n**Channel Description**\nRelated \`'/'\` commands are logged here.\nDesigned for all game platforms.");

        await serverLogging.send({ embeds: [embed] });

        const unbanLogging = await interaction.guild.channels.create({
          name: '🍻│𝗨nban-𝗟ogging',
          type: ChannelType.GuildText,
          parent: categoryProtection,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription("`🟢` `System Success`\nEverything has been setup correctly.\nThe channel is setting in our database.\n\n**Channel Description**\nRelated \`'/'\` commands are logged here.\nDesigned for all game platforms.");

        await unbanLogging.send({ embeds: [embed] });

        const banLogging = await interaction.guild.channels.create({
          name: '🍻│𝗕an-𝗟ogging',
          type: ChannelType.GuildText,
          parent: categoryProtection,
        });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription("`🟢` `System Success`\nEverything has been setup correctly.\nThe channel is setting in our database.\n\n**Channel Description**\nRelated \`'/'\` commands are logged here.\nDesigned for all game platforms.");

        await banLogging.send({ embeds: [embed] });

        await db.collection('discord-data').doc(interaction.guild.id).delete();
        await db.collection('discord-data').doc(interaction.guild.id)
          .set(
            {
              ['Server Protections']: {
                dupeProtection: dupeProtection.id, serverLogging: serverLogging.id,
                unbanLogging: unbanLogging.id, banLogging: banLogging.id,
              },
              ['Server Status']: {
                managementStatus: managementStatus.id, managementStatusMessage: managementStatusMessage.id,
              },
              token: token,
            }, { merge: true });

        const channelUrl = 'https://discordapp.com/channels';

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription(`\`🟢\` \`System Success\`\nYou've successfully linked your token.\nAuthorization token \`1\` of \`1\` uploaded.\nPermission \`service\` granted.\n\n**Nitrado Account Information**\nThe channels are setting in our database.\nThank you for registering your account.\nAccount: \`'${tokenInformation.user.username}'\`\n\n**Discord Information**\nConsider joining our [guild](https://discord.gg/jee3ukfvVr) for updates!\nActive developement and support.\n\`'Note: Happy hosting!'\``);

        await interaction.followUp({ embeds: [embed] });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setDescription(`\`🟢\` \`System Success\`\nThe channels have been executed.\nType \`/help\` for their information.\n\n**Obelisk Role Requirement**\n${roleManagement}\n\n**Obelisk Management**\n\`⚫\` [Command-Logs](${channelUrl}/${interaction.guild.id}/${managementLogs.id})\n\`⚫\` [Server-Status](${channelUrl}/${interaction.guild.id}/${managementStatus.id})\n\n**Obelisk Protection**\n\`🍻\` [Dupe-Protection](${channelUrl}/${interaction.guild.id}/${dupeProtection.id})\n\`🍻\` [Server-Logging](${channelUrl}/${interaction.guild.id}/${serverLogging.id})\n\`🍻\` [Unban-Logging](${channelUrl}/${interaction.guild.id}/${unbanLogging.id})\n\`🍻\` [Ban-Logging](${channelUrl}/${interaction.guild.id}/${banLogging.id})`);

        await interaction.followUp({ embeds: [embed] });

        embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟢\` \`System Success\`\nObelisk Manager has created an account!\nNew cluster connected to database.\nToken: \`'...${token.slice(-4)}'\` Servers: \`'${total}'\`\n\n**Global Command Listener**\nAll public bot \`'/'\` commands are logged.`);

        const channel = await interaction.client.channels.fetch('1095112613882511421');
        await channel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.log(error);
      embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle('`Obelisk Management`')
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setDescription(`\`🟠\` \`System Failure\`\nYour token has not been linked!\nSelected token does not exist.\n\n**Troubleshooting & Solution**\nEnsure you've granted bot access.\nScoped Permission: \`'Service'\``);

      await interaction.followUp({ embeds: [embed] });

    }
  }
};