const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let sock;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false // now using manual QR printing
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp connected!');
        }

        if (connection === 'close') {
            console.log('🔌 WhatsApp disconnected. Reconnecting...');
            startSock();
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startSock();

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: 'number and message are required' });
    }

    try {
        const jid = number.includes('@s.whatsapp.net') ? number : number + '@s.whatsapp.net';
        await sock.sendMessage(jid, { text: message });

        res.status(200).json({ status: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Message sending failed' });
    }
});

app.listen(port, () => {
    console.log(`🚀 API running at http://localhost:${port}`);
});
