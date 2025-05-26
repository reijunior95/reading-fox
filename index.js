// Arquivo: index.js

require("dotenv").config();
const { Client, GatewayIntentBits, Partials, REST, Routes, InteractionType, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder, Events } = require("discord.js");
const { loadTextsForLanguage } = require("./utils_sheets");
const { getQueue, addToQueue, removeFromQueue, nextInQueue } = require("./utils/queue");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const queue = [];

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
      await interaction.reply({ content: `✅ <@${userId}> joined the queue!`, ephemeral: true });
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
  }
});

client.login(process.env.BOT_TOKEN);
