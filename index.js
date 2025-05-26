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

const { getTextsByLanguage } = require("./utils_sheets");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const queue = [];

// REGISTRA COMANDO SLASH
const commands = [
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Start a new practice queue')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Registering slash command...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
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
  if (interaction.type === InteractionType.ApplicationCommand) {
    if (interaction.commandName === "queue") {
      queue.length = 0;
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🧑‍🤝‍🧑 Practice Queue")
            .setDescription("No one is in the queue yet. Click below to join!")
            .setColor("Blue")
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("join").setLabel("Join").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("leave").setLabel("Leave").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("instructions").setLabel("Instructions").setStyle(ButtonStyle.Primary)
          )
        ],
        fetchReply: true
      });
    }
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;

    if (interaction.customId === "join") {
      if (!queue.includes(userId)) queue.push(userId);
      await interaction.reply({
        content: `✅ <@${userId}> joined the queue!\n\n🌐 Please choose your language or submit your own text:`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("lang_english").setLabel("English").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("lang_spanish").setLabel("Spanish").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("lang_french").setLabel("French").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("lang_portuguese").setLabel("Portuguese").setStyle(ButtonStyle.Primary)
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("submit_custom_text").setLabel("Submit My Own Text").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("pass_turn").setLabel("Pass Turn").setStyle(ButtonStyle.Danger)
          )
        ],
        ephemeral: true
      });
    }

    if (interaction.customId === "leave") {
      const index = queue.indexOf(userId);
      if (index !== -1) queue.splice(index, 1);
      await interaction.reply({ content: `❌ <@${userId}> left the queue.`, ephemeral: true });
    }

    if (interaction.customId === "instructions") {
      await interaction.reply({
        content: "📘 **Instructions:**\n\n1. Click 'Join' to enter the queue.\n2. When it's your turn, select a language or submit your own text.\n3. Provide or receive corrections.\n4. Pass the turn when done.",
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith("lang_")) {
      const language = interaction.customId.replace("lang_", "");

      try {
        const texts = await getTextsByLanguage(language);
        if (!texts.length) {
          return interaction.reply({ content: `❌ No texts found for **${language}**.`, ephemeral: true });
        }

        const random = texts[Math.floor(Math.random() * texts.length)];

        return interaction.reply({
          content: `📘 Here's a random text for **${language}**:\n\n"${random.text}"`,
          ephemeral: true
        });
      } catch (err) {
        console.error("Error fetching texts:", err);
        return interaction.reply({ content: `⚠️ Error retrieving texts.`, ephemeral: true });
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

    if (interaction.customId === "pass_turn") {
      const currentIndex = queue.indexOf(userId);
      if (currentIndex !== -1) {
        queue.splice(currentIndex, 1);
        queue.push(userId);
      }
      await interaction.reply({
        content: `🔁 <@${userId}> passed their turn.`,
        ephemeral: true
      });
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "custom_text_modal") {
      const text = interaction.fields.getTextInputValue("custom_text_input");
      await interaction.reply({
        content: `📩 Here's the text you submitted:\n\n"${text}"`,
        ephemeral: true
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
