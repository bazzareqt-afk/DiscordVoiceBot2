const { Client, GatewayIntentBits } = require('discord.js');
const {
    joinVoiceChannel,
    VoiceConnectionStatus
} = require('@discordjs/voice');

console.log('=== BOT STARTING ===');
console.log('TOKEN exists:', !!process.env.TOKEN);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('CHANNEL_ID:', process.env.CHANNEL_ID);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let connection = null;
let reconnecting = false;

// ===== VOICE CONNECT =====
async function connectToVoice() {
    try {
        console.log('Connecting to voice...');

        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        connection = joinVoiceChannel({
            channelId: process.env.CHANNEL_ID,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });

        console.log('Voice connection created');

        connection.on('stateChange', (oldState, newState) => {
            console.log(`VOICE: ${oldState.status} -> ${newState.status}`);

            if (
                newState.status === VoiceConnectionStatus.Disconnected ||
                newState.status === VoiceConnectionStatus.Destroyed
            ) {
                reconnect();
            }
        });

    } catch (err) {
        console.error('Voice error:', err);
        reconnect();
    }
}

// ===== RECONNECT =====
function reconnect() {
    if (reconnecting) return;

    reconnecting = true;

    console.log('Reconnecting in 3 seconds...');

    try {
        if (connection) connection.destroy();
    } catch (err) {
        console.error(err);
    }

    setTimeout(async () => {
        reconnecting = false;
        await connectToVoice();
    }, 3000);
}

// ===== READY =====
client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    await connectToVoice();

    // backup checker
    setInterval(async () => {
        try {
            const guild = await client.guilds.fetch(process.env.GUILD_ID);
            const member = await guild.members.fetch(client.user.id);

            const currentChannel = member.voice.channelId;

            if (currentChannel !== process.env.CHANNEL_ID) {
                console.log('Bot not in correct channel, reconnecting...');
                reconnect();
            }
        } catch (err) {
            console.error(err);
        }
    }, 30000);
});

// ===== VOICE STATE (instant fix if kicked/moved) =====
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.id !== client.user.id) return;

    if (newState.channelId !== process.env.CHANNEL_ID) {
        console.log('Bot was moved or disconnected. Rejoining...');
        reconnect();
    }
});

// ===== SAFETY =====
client.on('error', console.error);
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ===== LOGIN =====
client.login(process.env.TOKEN);
