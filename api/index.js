// /api/index.js (cURLコマンド準拠 最終FIX版)

import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // preflightリクエストへの応答
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

    const endpoint = process.env.GLIDE_API_ENDPOINT;
    const token = process.env.GLIDE_BEARER_TOKEN;

    if (!endpoint || !token) {
        console.error("Server configuration error: Missing environment variables.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const payload = {
        "appID": "z5JvTxehlDjcHwp9m8lz",
        "mutations": [{
            "kind": "add-row-to-table",
            "tableName": "スタンプラリー202508",
            "columnValues": {
                // ↓↓↓↓↓↓【最終FIX】cURLコマンドのキーに完全に一致させました↓↓↓↓↓↓
                "取得QRコード": scannedQrData,
                "スタンプ": new Date().toISOString(),         // 「Timestamp」列のキーは「スタンプ」
                "fbbde0f492a8b3fa23261d9492872fd4": userEmail, // 「User Email」列のキーは内部ID
                "抽選": scannedQrData                       // 「Spot ID」列のキーは「抽選」
                // ↑↑↑↑↑↑【最終FIX】ここまで↑↑↑↑↑↑
            }
        }]
    };

    try {
        const glideResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!glideResponse.ok) {
            const errorText = await glideResponse.text();
            console.error(`Glide API Error: ${errorText}`);
            throw new Error(`Failed to write to Glide.`);
        }

        res.status(200).json({ message: 'Successfully added stamp.' });

    } catch (error) {
        console.error('Error forwarding to Glide:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
}
