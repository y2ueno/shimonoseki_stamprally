// /api/index.js (最終FIX版)

import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS設定（あなたのGitHub PagesのURLに合わせてください）
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

    // Vercelに設定した環境変数を取得
    const endpoint = process.env.GLIDE_API_ENDPOINT;
    const token = process.env.GLIDE_BEARER_TOKEN;

    if (!endpoint || !token) {
        console.error("Server configuration error: Missing environment variables.");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    // Glide APIが要求するデータ形式に整形（列名を完全に一致させました）
    const payload = {
        "appID": "z5JvTxehlDjcHwp9m8lz", // あなたのappID
        "mutations": [{
            "kind": "add-row-to-table",
            "tableName": "スタンプラリー202508",
            "columnValues": {
                // ↓↓↓↓↓↓ ここを修正しました ↓↓↓↓↓↓
                "Timestamp": new Date().toISOString(), // 「取得日時」→「Timestamp」に変更
                "User Email": userEmail,               // 「ユーザーEmail」→「User Email」に変更
                "Spot ID": scannedQrData,              // 「対象スポットID」→「Spot ID」に変更
                "取得QRコード": scannedQrData          // 「取得QRコード」列にも同じIDを書き込み
                // ↑↑↑↑↑↑ ここを修正しました ↑↑↑↑↑↑
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
