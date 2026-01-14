import * as glide from "@glideapps/tables";

// --- 1. 一般ユーザー用：Glide API 設定（既存） ---
const stampTable = glide.table({
    token: "630d3d15-b31b-48dd-8938-3a7ac40a6310",
    app: "b2Ps68iDJmpTVBfsXJdE",
    table: "スタンプラリー202508",
    columns: {
        userSEMail: { type: "email-address", name: "User's E-Mail" },
        qr: { type: "string", name: "取得QRコード" },
        spot: { type: "string", name: "Spot名" },
        timestamp: { type: "date-time", name: "timestamp" }
    }
});

export default async function handler(req, res) {
    // CORS 設定
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const body = req.body;

    // --- 2. 【追加】スタッフ用アプリ (staff.html) からのリクエスト判定 ---
    // staff_email が含まれている場合は GAS へ転送します
    if (body.staff_email) {
        // 先ほど取得した正しい GAS の URL です
        const GAS_URL = "https://script.google.com/macros/s/AKfycbw-teQvWo5FZpUXPKdoxpYivXaRc-XEdQkI4tIDV8bzFP5r4G-HbjSYa1o2WLuF2gTtkQ/exec";
        
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            console.error('GAS転送エラー:', error);
            return res.status(500).json({ success: false, message: "GASへの送信に失敗しました", detail: error.message });
        }
    }

    // --- 3. 一般ユーザー用アプリからのリクエスト処理（既存の Glide 処理） ---
    const { email, qrData } = body;

    try {
        console.log("一般ユーザー重複チェック開始:", email, qrData);
        
        let rows;
        try {
            rows = await stampTable.get();
        } catch (getErr) {
            return res.status(500).json({ 
                success: false, 
                message: "Glideテーブルへのアクセスに失敗しました。",
                detail: getErr.message 
            });
        }

        const isDuplicate = rows.some(row => 
            row.userSEMail === email && (row.qr === qrData || row.spot === qrData)
        );

        if (isDuplicate) {
            return res.status(200).json({ success: false, duplicate: true });
        }

        await stampTable.add({
            userSEMail: email,
            qr: qrData,
            spot: qrData,
            timestamp: new Date()
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('一般ユーザーAPI内部エラー:', error);
        return res.status(500).json({ 
            success: false, 
            message: "API内部で予期せぬエラーが発生しました。",
            detail: error.message 
        });
    }
}
