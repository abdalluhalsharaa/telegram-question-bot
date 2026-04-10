const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot is alive');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = '@YourChannelUsername'; // غيّرها

bot.on('message', async (msg) => {
    const text = msg.text;
    if (!text) return;

    // =========================
    // 1. Extract title block
    // =========================
    const titleMatch = text.match(/🔻{7}\s*\n([\s\S]*?)\n🔻{7}/);

    if (!titleMatch) return;

    const title = titleMatch[1].trim();

    const sentTitle = await bot.sendMessage(
        CHANNEL_ID,
        `🔻🔻🔻🔻🔻🔻🔻\n${title}\n🔻🔻🔻🔻🔻🔻🔻`
    );

    try {
        await bot.pinChatMessage(CHANNEL_ID, sentTitle.message_id);
    } catch (err) {
        console.log(err.message);
    }

    // =========================
    // 2. Split questions
    // =========================
    const lines = text.split('\n');

    let blocks = [];
    let current = [];

    for (let line of lines) {
        if (/^\d+\.\s/.test(line)) {
            if (current.length) blocks.push(current.join('\n'));
            current = [line];
        } else {
            if (current.length) current.push(line);
        }
    }

    if (current.length) blocks.push(current.join('\n'));

    // =========================
    // 3. Send quizzes
    // =========================
    for (let q of blocks) {
        const qLines = q.split('\n');
        if (qLines.length < 5) continue;

        const question = qLines[0].replace(/^\d+\.\s*/, '').trim();

        let options = [];
        let correctIndex = -1;

        for (let i = 1; i <= 4; i++) {
            let option = qLines[i];

            if (option.includes('✅')) {
                correctIndex = i - 1;
                option = option.replace('✅', '').trim();
            }

            options.push(option.replace(/^[A-D]\)\s*/, '').trim());
        }

        if (correctIndex === -1) continue;

        try {
            await bot.sendPoll(
                CHANNEL_ID,
                question,
                options,
                {
                    type: 'quiz',
                    correct_option_id: correctIndex,
                    is_anonymous: false
                }
            );
        } catch (err) {
            console.log(err.message);
        }
    }

    // =========================
    // 4. Final message
    // =========================
    if (text.includes('تم بحمد الله') || text.includes('✅✅✅')) {
        await bot.sendMessage(
            CHANNEL_ID,
            '✅✅✅ تم بحمد الله ✅✅✅'
        );
    }
});
