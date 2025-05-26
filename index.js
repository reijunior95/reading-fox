// index.js 

require("dotenv").config();
const {
Client,
GatewayIntentBits,
Partials,
REST,
Routes,
InteractionType,
ButtonStyle,
ActionRowBuilder,
ButtonBuilder,
EmbedBuilder,
SlashCommandBuilder,
TextInputBuilder,
TextInputStyle,
ModalBuilder,
Events
} = require("discord.js");

const { getTextsByLanguage } = require("./utils\_sheets");

const client = new Client({
intents: \[GatewayIntentBits.Guilds],
partials: \[Partials.Channel]
});

const queue = \[];
const corrections = {};

const commands = \[
new SlashCommandBuilder()
.setName('queue')
.setDescription('Start a new practice queue')
.toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT\_TOKEN);
(async () => {
try {
console.log('Registering slash command...');
await rest.put(
Routes.applicationCommands(process.env.CLIENT\_ID),
{ body: commands }
);
console.log('Slash command registered successfully ✅');
} catch (err) {
console.error('Error registering slash command:', err);
}
})();

client.once("ready", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
if (interaction.type === InteractionType.ApplicationCommand && interaction.commandName === "queue") {
queue.length = 0;

```
await interaction.reply({
  embeds: [
    new EmbedBuilder()
      .setTitle("📚 Sesión de Lectura / Reading Session | Multilingual")
      .setDescription("-- Cola / Queue --\nVacío / Empty\n\nif bugs: ping @pip\nif text problem: ping @bobi")
      .setColor("Blue")
  ],
  components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join").setLabel("Unirse / Enter").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("leave").setLabel("Salir / Leave").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("instructions").setLabel("Instrucciones / Instructions").setStyle(ButtonStyle.Secondary)
    )
  ]
});
```

}

if (interaction.isButton()) {
const userId = interaction.user.id;

```
if (interaction.customId === "join") {
  if (!queue.includes(userId)) queue.push(userId);

  await interaction.channel.send({
    content: `👤 <@${userId}> joined the queue!\n**Please choose your language or submit your own text:**`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("lang_english").setLabel("English").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("lang_spanish").setLabel("Spanish").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("lang_french").setLabel("French").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("lang_portuguese").setLabel("Portuguese").setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("submit_custom_text").setLabel("Tu propio texto / Your own text").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("pass_turn").setLabel("Pasar Turno / Pass Turn").setStyle(ButtonStyle.Danger)
      )
    ]
  });
  await interaction.deferUpdate();
}

if (interaction.customId === "leave") {
  const index = queue.indexOf(userId);
  if (index !== -1) queue.splice(index, 1);
  await interaction.reply({ content: `❌ <@${userId}> left the queue.`, ephemeral: false });
}

if (interaction.customId === "instructions") {
  await interaction.reply({
    content: "📘 **Instructions:**\n\n1. Join the queue.\n2. Choose a language or your own text.\n3. Submit corrections.\n4. Pass your turn.",
    ephemeral: false
  });
}

if (interaction.customId.startsWith("lang_")) {
  const language = interaction.customId.replace("lang_", "");

  try {
    const texts = await getTextsByLanguage(language);
    if (!texts.length) return interaction.reply({ content: `❌ No texts for **${language}**.`, ephemeral: false });

    const random = texts[Math.floor(Math.random() * texts.length)];
    const embed = new EmbedBuilder()
      .setTitle(`📝 Reading (${language})`)
      .setDescription(random.text)
      .setColor("Green");

    await interaction.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("submit_corrections").setLabel("Poner Correcciones / Submit Corrections").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("pass_turn").setLabel("Pasar Turno / Pass Turn").setStyle(ButtonStyle.Danger)
        )
      ]
    });
    await interaction.deferUpdate();
  } catch (err) {
    console.error("Error fetching texts:", err);
    await interaction.reply({ content: `⚠️ Error getting texts.`, ephemeral: true });
  }
}

if (interaction.customId === "submit_custom_text") {
  const modal = new ModalBuilder()
    .setCustomId("custom_text_modal")
    .setTitle("Submit Your Text")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("custom_text_input")
          .setLabel("Paste your text here")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );
  await interaction.showModal(modal);
}

if (interaction.customId === "submit_corrections") {
  const modal = new ModalBuilder()
    .setCustomId("corrections_modal")
    .setTitle("Correcciones / Corrections")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("corrections_input")
          .setLabel("List your corrections")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );
  await interaction.showModal(modal);
}

if (interaction.customId === "pass_turn") {
  const index = queue.indexOf(userId);
  if (index !== -1) {
    queue.splice(index, 1);
    queue.push(userId);
  }
  await interaction.channel.send({ content: `🔁 <@${userId}> passed the turn.` });
  await interaction.deferUpdate();
}
```

}

if (interaction.isModalSubmit()) {
if (interaction.customId === "custom\_text\_modal") {
const text = interaction.fields.getTextInputValue("custom\_text\_input");
await interaction.channel.send({
embeds: \[
new EmbedBuilder().setTitle("📩 Custom Text Submitted").setDescription(text).setColor("Purple")
]
});
await interaction.deferUpdate();
}

```
if (interaction.customId === "corrections_modal") {
  const text = interaction.fields.getTextInputValue("corrections_input");
  const username = interaction.user.username;
  if (!corrections[username]) corrections[username] = [];
  corrections[username].push(text);

  const embed = new EmbedBuilder()
    .setTitle("✅ Correcciones / Corrections")
    .setColor("DarkGreen");

  for (const [user, entries] of Object.entries(corrections)) {
    embed.addFields({ name: `@${user} suggests:`, value: entries.join("\n"), inline: false });
  }

  await interaction.channel.send({ embeds: [embed] });
  await interaction.deferUpdate();
}
```

}
});

client.login(process.env.BOT\_TOKEN);
