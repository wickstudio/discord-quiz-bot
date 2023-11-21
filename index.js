const fs = require('fs');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Sequelize, DataTypes } = require('sequelize');

// Create the Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Log when the bot is online
client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
  console.log(`Code by Wick Studio`);
  console.log(`discord.gg/wicks`);
});

// Connect to SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false,
});

const Points = sequelize.define('Points', {
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

// Read configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// User ID allowed to use the clear command
const allowedClearUserId = config.allowedClearUserId;

// Read questions from quiz.json
const quizData = JSON.parse(fs.readFileSync('quiz.json', 'utf8'));

// Read quotes from quotes.json
const quotesData = JSON.parse(fs.readFileSync('quotes.json', 'utf8'));

// Map to store user cooldowns
const quizCooldowns = new Map();

async function getPointsFromDatabase(guildId, userId) {
  try {
    let userPoints = await Points.findOne({ where: { guildId, userId } });
    if (!userPoints) {
      userPoints = await Points.create({ guildId, userId, points: 0 });
    }

    return userPoints.points;
  } catch (error) {
    console.error('Error getting points from the database:', error);
    return 0;
  }
}

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const prefix = config.prefix || '!';
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'quiz') {
    if (quizCooldowns.has(message.author.id)) {
      message.reply({ content: 'You are on cooldown!', ephemeral: true });
      return;
    }

    sendQuizQuestion(message);

    quizCooldowns.set(message.author.id, true);
    setTimeout(() => {
      quizCooldowns.delete(message.author.id);
    }, 10000); // 10 seconds
  } else if (command === 'points') {
    displayLeaderboard(message);
  } else if (command === 'clear' && message.author.id === allowedClearUserId) {
    clearLeaderboard(message);
  } else if (command === 'tweet') {
    sendRandomQuote(message);
  }
});

async function sendQuizQuestion(message) {
  try {
    const randomQuestion = quizData[Math.floor(Math.random() * quizData.length)];

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Quiz Game')
      .setThumbnail('https://media.discordapp.net/attachments/1171933619766435882/1173026889795899513/R.png?ex=6562756c&is=6550006c&hm=cbce71afbf2ba0426c2513bc11c0ae6ca4e16a27e779e590c4e9a98f3dacecf5&=&width=675&height=675')
      .setDescription(`**${randomQuestion.question}**`);

    const row = new MessageActionRow().addComponents(
      randomQuestion.options.map((option, index) =>
        new MessageButton()
          .setCustomId(`option_${index}`)
          .setLabel(option)
          .setStyle('PRIMARY')
      )
    );

    const quizMessage = await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    const filter = (interaction) => interaction.customId.startsWith('option_');
    const collector = message.channel.createMessageComponentCollector({
      filter,
      time: 10000, // 10 seconds timeout
    });

    collector.on('collect', async (interaction) => {
      const selectedOption = interaction.customId.split('_')[1];
      if (randomQuestion.options[selectedOption] === randomQuestion.correctAnswer) {
        const user = interaction.user;
        interaction.reply({ content: `Correct! You got 1 point. Your total points: ${await getPointsFromDatabase(interaction.guild.id, user.id)}`, ephemeral: true });
        await incrementPointsInDatabase(interaction.guild.id, user.id);
      } else {
        interaction.reply({ content: 'wrong answer!', ephemeral: true });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        message.channel.send('Time is up! No one has answered.');
      }
    });
  } catch (error) {
    console.error('Error sending quiz question:', error);
  }
}

async function incrementPointsInDatabase(guildId, userId) {
  try {
    let userPoints = await Points.findOne({ where: { guildId, userId } });
    if (!userPoints) {
      userPoints = await Points.create({ guildId, userId, points: 0 });
    }

    userPoints.points++;

    await userPoints.save();
  } catch (error) {
    console.error('Error incrementing points in the database:', error);
  }
}

async function displayLeaderboard(message) {
  try {
    const topUsers = await Points.findAll({
      where: { guildId: message.guild.id },
      order: [['points', 'DESC']],
      limit: 10,
    });

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Points Leaderboard')
      .setThumbnail('https://media.discordapp.net/attachments/1171933619766435882/1173031471947190432/leaderboard-icon-16.png?ex=656279b0&is=655004b0&hm=9fb95568d32acfcd23a6303da3c55ece85b191e536dac99102089bce30a5b15e&=&width=675&height=675')
      .setDescription('Top 10 users with the highest points')
      .addFields(
        topUsers.map((user, index) => ({
          name: `#${index + 1} ${message.guild.members.cache.get(user.userId)?.user?.username || 'Unknown User'}`,
          value: `Points : ${user.points}`,
        }))
      );

    message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error displaying leaderboard:', error);
  }
}

async function clearLeaderboard(message) {
  try {
    await Points.destroy({ where: { guildId: message.guild.id } });

    message.channel.send('Leaderboard cleared!');
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    message.channel.send('An error occurred while clearing the leaderboard.');
  }
}

function sendRandomQuote(message) {
  const randomQuote = quotesData[Math.floor(Math.random() * quotesData.length)];

  const embed = new MessageEmbed()
    .setColor('#3498db')
    .setThumbnail('https://media.discordapp.net/attachments/1171933619766435882/1173035016008237106/Quote.png?ex=65627cfd&is=655007fd&hm=36e692a29fbdaf512e7814f5d46555d76477c8a429bb2d37c1b73748adf96f6b&=&width=675&height=675')
    .setTitle('Quote Tweet')
    .setDescription(`*"${randomQuote.quote}"*`)
    .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }));

  message.channel.send({ embeds: [embed] });
}

sequelize.sync();

client.login(config.token);
