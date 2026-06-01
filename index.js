const { Client, GatewayIntentBits } = require('discord.js');
const {
    joinVoiceChannel,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let connection = null;
let reconnecting = false;

let lastWhenYaReply = 0;
let spamCombo = 0;

const normalReplies = [
    'when ya mulu kampoeng',
    'sabar dikit kampoeng',
    'nanya when ya terus kampoeng',
    'gue juga ga tau kampoeng',
    'besok tanya lagi kampoeng',
];

const spamReplies = [
    'ga usah spam gua kampoeng',
    'baru juga dijawab kampoeng',
    'sabar napa kampoeng',
    'nanya mulu kampoeng',
    'otak when ya doang kampoeng',
    'cooldown dulu kampoeng',
    'udah gue jawab kampoeng',
    'ga capek nanya kampoeng',
    'coba baca chat sebelumnya kampoeng'
];

async function connectToVoice() {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        connection.on('stateChange', (_, newState) => {
            if (
                newState.status === VoiceConnectionStatus.Disconnected ||
                newState.status === VoiceConnectionStatus.Destroyed
            ) {
                reconnect();
            }
        });

        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            30000
        );

        console.log('Connected to voice');
    } catch (err) {
        console.error(err);
        reconnect();
    }
}

async function reconnect() {
    if (reconnecting) return;

    reconnecting = true;

    try {
        if (connection) {
            connection.destroy();
        }
    } catch {}

    setTimeout(async () => {
        reconnecting = false;
        await connectToVoice();
    }, 10000);
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    await connectToVoice();

    setInterval(async () => {
        try {
            if (
                !connection ||
                connection.state.status ===
                    VoiceConnectionStatus.Disconnected ||
                connection.state.status ===
                    VoiceConnectionStatus.Destroyed
            ) {
                reconnect();
            }
        } catch {}
    }, 60000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    if (!content.includes('when ya')) return;

    const now = Date.now();

    if (now - lastWhenYaReply < 10000) {
        spamCombo++;

        let reply;

        switch (spamCombo) {
            case 1:
                reply = spamReplies[
                    Math.floor(Math.random() * spamReplies.length)
                ];
                break;

            case 2:
                reply = 'masih aja kampoeng';
                break;

            case 3:
                reply = 'cari hobi sana kampoeng';
                break;

            case 4:
                reply = 'mute nih lama lama kampoeng';
                break;

            case 5:
                reply = '🩴';
                break;

            default:
                reply = [
                    '🩴',
                    '🚪',
                    '🙄',
                    '💀',
                    'kampoeng.'
                ][Math.floor(Math.random() * 5)];
        }

        await message.reply(reply);
        return;
    }

    spamCombo = 0;
    lastWhenYaReply = now;

    const reply =
        normalReplies[Math.floor(Math.random() * normalReplies.length)];

    await message.reply(reply);
});

client.on('error', console.error);
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);