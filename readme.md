
# Discord Quiz Bot

![banner](https://cdn.discordapp.com/attachments/1176552110410707055/1176554172884197477/image.png?ex=656f4a76&is=655cd576&hm=a17b9c7ac6bc8d454ecd8bbf9bdf090a29fefc0076b50ea95db8d815f5e5020d&)

## Overview

This is a simple Discord bot written in JavaScript using the Discord.js library. The bot includes features like quizzes, points tracking, leaderboards, and random quotes.

## Features

- Quiz Command: Start a quiz and earn points for correct answers.
- Points Command: Check your current points.
- Leaderboard Command: View the top users with the highest points.
- Clear Command: Clear the points leaderboard (restricted to specific users).
- Quote Command: Get a random inspirational quote.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/wickstudio/discord-quiz-bot.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the bot:

   - Create a `config.json` file based on the provided `config.example.json`.
   - Add your Discord bot token and any other configurations.

4. Set up the database:

   - The bot uses SQLite, and the database is stored in `database.sqlite`.
   - Ensure you have SQLite installed on your machine.

   ```bash
   npm install sqlite3
   ```

5. Run the bot:

   ```bash
   npm start
   ```

## Usage

- Run the bot and invite it to your Discord server.
- Use the provided commands (`!quiz`, `!points`, `!leaderboard`, `!clear`, `!quote`) to interact with the bot.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or create a pull request.

## License

This project is licensed under the [MIT License](LICENSE).