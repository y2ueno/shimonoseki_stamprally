// /api/index.js (CORS設定 最終確認版)

import fetch from 'node-fetch';

export default async function handler(req, res) {
    // ↓↓↓↓↓↓【重要】ここがCORS設定です↓↓↓↓↓↓
    // エラーメッセージに表示された 'origin' と完全に一致させます
    res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // ↑↑↑↑↑↑【重要】ここまでがCORS設定です↑↑↑↑↑↑

    // ブラウザが本番のPOSTリクエストを送る前に行う「事前確認（preflight）」に応答します
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // (これ以降のコードは変更ありません)
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
                "Timestamp": new Date().toISOString(),
                "User Email": userEmail,
                "Spot ID": scannedQrData,
                "取得QRコード": scannedQrData
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
