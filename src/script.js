// Require the necessary discord.js classes
const { Client, Events, Collection, GatewayIntentBits, ActivityType, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { token } = require('./config.json');
const path = require('node:path');
const fs = require('node:fs');

process.setMaxListeners(15);
const serviceAccount = require('./firebase.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

module.exports = { db };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const eventsPath = path.join(__dirname, './event-handler');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const commandsPathPlayerManagement = path.join(__dirname, './command-handler');
const commandFiles = fs.readdirSync(commandsPathPlayerManagement).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPathPlayerManagement, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

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

client.on('ready', (event) => {
  console.log(`${event.user.tag} is online.`);

  let totalMembers = 0;
  client.guilds.cache.forEach(guild => {
    totalMembers += guild.memberCount;
  });

  client.user.setActivity('/ commands', { type: ActivityType.Listening });
  console.log(`I'm in ${client.guilds.cache.size} servers with a total of ${totalMembers} members.`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  await interaction.deferReply({ ephemeral: true });
  const selected = interaction.values;

  if (selected[0] === 'first_option') {
    let embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('`Obelisk Management`')
      .setFooter({ text: `Tip: Contact support if there are issues.` })
      .setDescription(`**Installation & Setup Process**\nBefore the bot can work properly, you will need to connect it to your server, via a token, from Nitrado. Follow the steps below to link the obelisk. \n\n**Obtaining Token**\n\`#1:\` Login to Nitrado\n\`#2:\` Select \`'My Account'\`\n\`#3:\` Select \`'Developer Portal'\`\n\`#4:\` Select \`'Long-Life Tokens'\`\n\n**Additional Information**\nOnce you've reached this page, you'll see a field where you need to give the token a name, for this name, label it: \`'obelisk management'\`. After, you will need to select the \`'service'\` permission for the bot. Click create, then a token will appear at the top of your screen, copy the entire token w/o spaces around it. \n\n**Activate The Obelisk Bot**\nThe bot was developed with ease of use in mind. To set up your obelisk bot, you need to type one \`'/'\` command: \`'/setup-token'\` - Enter your token in this field, and the bot will finish the installation process. Read everything!\n\n\`🔗\` Click [here](https://discord.gg/jee3ukfvVr) to join the server!\n\`🔗\` Click [here](https://discord.com/api/oauth2/authorize?client_id=987467099855282276&permissions=8&scope=bot%20applications.commands) to invite the bot!\n\nExample: [Video #1](https://streamable.com/7cp6b6) - [Video #2](https://streamable.com/qj7dnm)`);

    await interaction.followUp({ embeds: [embed] });
  }
});

client.login(token);