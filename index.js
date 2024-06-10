// Dependencies
require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const CatLoggr = require('cat-loggr');
const readline = require('readline');

// Funktionen
const client = new Discord.Client();
const log = new CatLoggr();
const keep_alive = require('./keep_alive.js')

// Neue Discord-Sammlungen
client.commands = new Discord.Collection();

// Logging
if (config.debug === true) client.on('debug', stream => log.debug(stream)); // falls debug im config aktiviert ist
client.on('warn', message => log.warn(message));
client.on('error', error => log.error(error));

// Befehle aus dem Ordner laden
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // Befehlsverzeichnis
for (const file of commandFiles) {
  const command = require(`./commands/${file}`); // Befehl laden
  log.init(`Loaded command ${file.split('.')[0] === command.name ? file.split('.')[0] : `${file.split('.')[0]} as ${command.name}`}`); // Logging in die Konsole
  client.commands.set(command.name, command); // Befehl nach Namen in die Discord-"commands"-Sammlung setzen
}

// Client-Login
client.login(process.env.TOKEN);

client.once('ready', () => {
  log.info(`I am logged in as ${client.user.tag} to Discord!`); // Begrüßung in der Konsole
  client.user.setActivity(`${config.prefix}help • ${client.user.username.toUpperCase()}`, { type: "WATCHING" }); // Den Aktivitätsstatus des Bots setzen
  /* Du kannst den Aktivitätstyp ändern zu:
   * LISTENING
   * WATCHING
   * COMPETING
   * STREAMING (du musst einen twitch.tv-URL neben dem Typ hinzufügen, wie folgt: { type: "STREAMING", url: "https://twitch.tv/twitch_username_here"} )
   * PLAYING (Standard)
  */

  // Alle 5 Minuten zufällige Nachrichten in den Gen-Kanal senden
  const genChannelId = '1246717441850216448'; // Ersetze dies durch die tatsächliche ID des Gen-Kanals
  const randomMessages = [
    "Hello, @BotListener!",
    "How's it going?",
    "Don't forget to check out our latest updates!",
    "Have a great day!",
    "Remember to be kind to one another.",
    "What's everyone up to?",
    "Stay positive and keep pushing forward!",
    "Did you know? Random facts can be fun!",
    "Time for a break, grab a coffee!",
    "Keep calm and chat on!",
    "Welcome to the server!",
    "Enjoy your stay here!",
    "Need any help? Just ask!",
    "Check out the new channels!",
    "Make sure to read the rules.",
    "Feel free to introduce yourself!",
    "What's your favorite hobby?",
    "Any gamers here?",
    "Music lovers, share your playlist!",
    "Let's keep the conversation friendly.",
    "Any plans for the weekend?",
    "Movie night suggestions?",
    "Share your favorite book!",
    "Anyone up for a challenge?",
    "Don't forget to hydrate!",
    "Share your pet pictures!",
    "What's your favorite quote?",
    "Let's discuss some fun facts!",
    "What's the weather like for you?",
  ];
  setInterval(() => {
    const channel = client.channels.cache.get(genChannelId);
    if (channel) {
      const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      channel.send(message);
    } else {
      log.error(`Channel with ID ${genChannelId} not found.`);
    }
  }, 5 * 60 * 1000); // 5 Minuten Intervall

  // Konsolen-Eingabe zum Senden von Nachrichten an den Discord-Kanal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    const channel = client.channels.cache.get(genChannelId);
    if (channel) {
      channel.send(input).catch(err => log.error(`Failed to send message: ${err}`));
    } else {
      log.error(`Channel with ID ${genChannelId} not found.`);
    }
  });
});

// Discord Nachrichten-Ereignis und Befehlshandhabung
client.on('message', (message) => {
  if (!message.content.startsWith(config.prefix)) return; // Wenn die Nachricht nicht mit dem Präfix beginnt
  if (message.author.bot) return; // Wenn ein Befehl von einem Bot ausgeführt wird

  // Nachrichteninhalt in Argumente aufteilen
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Log-Ausgabe, wenn ein Befehl ausgeführt wird
  console.log(`User ${message.author.tag} used command: ${command}`);

  // Wenn der Befehl nicht existiert
  if (config.command.notfound_message === true && !client.commands.has(command)) {
    return message.channel.send(
      new Discord.MessageEmbed()
      .setColor(config.color.red)
      .setTitle('Unknown command :(')
      .setDescription(`Sorry, but I cannot find the \`${command}\` command!`)
      .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
      .setTimestamp()
    );
  }

  // Befehl ausführen
  try {
    client.commands.get(command).execute(message, args); // Ausführen
  } catch (error) {
    log.error(error); // Logging bei Fehlern

    // Fehlermeldung senden, wenn das "error_message"-Feld in der Konfiguration "true" ist
    if (config.command.error_message === true) {
      message.channel.send(
        new Discord.MessageEmbed()
        .setColor(config.color.red)
        .setTitle('Error occurred!')
        .setDescription(`An error occurred while executing the \`${command}\` command!`)
        .addField('Error', `\`\`\`js\n${error}\n\`\`\``)
        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
        .setTimestamp()
      );
    }
  }
});

//By ash3r#1000
//Subscribe 
// For Help Join https://discord.gg/jsk
