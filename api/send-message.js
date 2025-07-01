const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

const authFile = path.resolve(__dirname, 'auth_info.json'); // session file in same folder
const { state, saveState } = useSingleFileAuthState(authFile);

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
});

sock.ev.on('creds.update', saveState);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  const { number, message } = req.body;

  if (!number || !message) {
    res.status(400).json({ status: 'error', message: 'Missing number or message' });
    return;
  }

  try {
    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });

    res.status(200).json({ status: 'success', message: 'Message sent!' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
};
