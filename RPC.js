#!/usr/bin/env node

const RPC = require('discord-rpc');

async function getPsList() {
    // dynamically import ps-list (ESM)
    return (await import('ps-list')).default;
}

// Read client ID & user ID
const clientId = process.env.DISCORD_CLIENT_ID || process.argv[2];
const userId = process.env.DISCORD_USER_ID || process.argv[3];

if (!clientId || !userId) {
    console.error("❌ Missing Client ID or User ID.\nUsage: virtualbox-rpc <clientId> <userId>");
    process.exit(1);
}

RPC.register(clientId);

const rpc = new RPC.Client({ transport: 'ipc' });

async function checkVirtualBox() {
    const psList = await getPsList();
    const processes = await psList();
    return processes.some(p => p.name.toLowerCase() === 'virtualbox.exe');
}

async function updateRPC() {
    const running = await checkVirtualBox();

    if (running) {
        await rpc.setActivity({
            details: 'Running VirtualBox VM',
            state: 'Active VM detected',
            startTimestamp: new Date(),
            largeImageKey: 'Virtualbox_logo', // must exist in Discord Developer Portal
            largeImageText: 'VirtualBox Emulator',
            smallImageKey: 'vm_icon',
            smallImageText: 'VM Running',
            instance: false,
        });
        console.log(`✅ RPC updated for user ${userId}: VirtualBox running!`);
    } else {
        await rpc.clearActivity();
        console.log(`ℹ️ RPC cleared for user ${userId}: VirtualBox not running.`);
    }
}

// Connect to Discord
rpc.on('ready', () => {
    console.log(`🔗 RPC connected for user ${userId}!`);
    setInterval(updateRPC, 10000); // every 10 seconds
});

rpc.login({ clientId }).catch(console.error);
