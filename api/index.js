// api/index.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', 'https://<YOUR_GITHUB_USERNAME>.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed.' });
    }

    const { userEmail, scannedQrData } = req.body;

    if (!userEmail || !scannedQrData) {
        return res.status(400).json({ message: 'Missing userEmail or scannedQrData.' });
    }

    // 環境変数からWebhook URLを取得 (Vercelの管理画面で設定)
    const glideWebhookUrl = process.env.GLIDE_WEBHOOK_URL;

    const payload = {
      // (中身は前回と同じなので省略)
    };

    try {
        const glideResponse = await fetch(glideWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!glideResponse.ok) {
            throw new Error('Failed to write to Glide.');
        }

        res.status(200).json({ message: 'Successfully added stamp.' });

    } catch (error) {
        console.error('Error forwarding to Glide:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
}
