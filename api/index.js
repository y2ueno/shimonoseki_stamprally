import * as glide from "@glideapps/tables";

// Glide API 設定
const stampTable = glide.table({
    token: "630d3d15-b31b-48dd-8938-3a7ac40a6310",
    app: "b2Ps68iDJmpTVBfsXJdE",
    table: "スタンプラリー202508", // 新しいシート名
    columns: {
        userSEMail: { type: "email-address", name: "User's E-Mail" },
        qr: { type: "string", name: "取得QRコード" },
        spot: { type: "string", name: "Spot名" },
        timestamp: { type: "date-time", name: "timestamp" }
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, qrData } = req.body;

    if (!email || !qrData) {
        return res.status(400).json({ error: 'Email or QR Data is missing' });
    }

    try {
        // 1. 既存のデータを取得して重複チェック
        const rows = await stampTable.get();
        
        // 同一ユーザーが同じQR/スポットを既に持っているか判定
        const isDuplicate = rows.some(row => 
            row.userSEMail === email && (row.qr === qrData || row.spot === qrData)
        );

        if (isDuplicate) {
            return res.status(200).json({ 
                success: false, 
                duplicate: true, 
                message: 'このスポットのスタンプはすでに取得済みです' 
            });
        }

        // 2. 重複がなければ新規行を追加
        await stampTable.add({
            userSEMail: email,
            qr: qrData,
            spot: qrData, // QRコードの内容をそのままスポット名として記録
            timestamp: new Date()
        });

        return res.status(200).json({ success: true, message: 'Stamp recorded successfully' });

    } catch (error) {
        console.error('Glide API Error:', error);
        return res.status(500).json({ error: 'Failed to record stamp' });
    }
}
