const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')

let sockPromise // so we initialize once

async function getSock() {
    if (!sockPromise) {
        sockPromise = (async () => {
            const { state, saveCreds } = await useMultiFileAuthState('sessions')
            const { version } = await fetchLatestBaileysVersion()
            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                browser: ['Ubuntu', 'Chrome', '22.04.4']
            })
            sock.ev.on('creds.update', saveCreds)
            return sock
        })()
    }
    return sockPromise
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Only POST allowed' })
    }

    const { number, message } = req.body

    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: 'Missing number or message' })
    }

    try {
        const sock = await getSock()
        const jid = number + '@s.whatsapp.net'
        await sock.sendMessage(jid, { text: message })

        res.status(200).json({ status: 'success', to: number, message })
    } catch (err) {
        console.error('❌', err)
        res.status(500).json({ status: 'error', error: err.message })
    }
}

