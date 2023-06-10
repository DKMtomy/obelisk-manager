const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { token } = require('./config.json');
const path = require('path');
const fs = require('fs');

process.setMaxListeners(15);
const serviceAccount = require('./firebase.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Map();

// Load event handlers
const eventPath = path.join(__dirname, 'event-handler');
const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Load command handlers
const commandPath = path.join(__dirname, 'command-handler');
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ${path.join(commandPath, file)} is missing a required "data" or "execute" property.`);
  }
}

// Interaction command handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Ready event handling
client.once('ready', () => {
  console.log(`${client.user.tag} is online.`);

  let totalMembers = 0;
  client.guilds.cache.forEach(guild => {
    totalMembers += guild.memberCount;
  });

  client.user.setActivity('/ commands', { type: ActivityType.LISTENING });
  console.log(`I'm in ${client.guilds.cache.size} servers with a total of ${totalMembers} members.`);
});

// String select menu handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isSelectMenu()) return;

  await interaction.deferReply({ ephemeral: true });
  const selected = interaction.values;

  if (selected[0] === 'first_option') {
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('Obelisk Management')
      .setFooter({ text: 'Tip: Contact support if there are issues.' })
      .setDescription(`**Installation & Setup Process**\nBefore the bot can work properly, you will need to connect it to your server, via a token, from Nitrado. Follow the steps below to link the obelisk. \n\n**Obtaining Token**\n\`#1:\` Login to Nitrado\n\`#2:\` Select \`'My Account'\`\n\`#3:\` Select \`'Developer Portal'\`\n\`#4:\` Select \`'Long-Life Tokens'\`\n\n**Additional Information**\nOnce you've reached this page, you'll see a field where you need to give the token a name, for this name, label it: \`'obelisk management'\`. After, you will need to select the \`'service'\` permission for the bot. Click create, then a token will appear at the top of your screen, copy the entire token w/o spaces around it. \n\n**Activate The Obelisk Bot**\nThe bot was developed with ease of use in mind. To set up your obelisk bot, you need to type one \`'/'\` command: \`'/setup-token'\` - Enter your token in this field, and the bot will finish the installation process. Read everything!\n\n[Click here to join the server](https://discord.gg/jee3ukfvVr)\n[Click here to invite the bot](https://discord.com/api/oauth2/authorize?client_id=987467099855282276&permissions=8&scope=bot%20applications.commands)\n\nExample: [Video #1](https://streamable.com/7cp6b6) - [Video #2](https://streamable.com/qj7dnm)`);

    await interaction.followUp({ embeds: [embed] });
  }
});

client.login(token);
