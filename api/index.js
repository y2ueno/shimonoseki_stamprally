import * as glide from "@glideapps/tables";

// Glide API 設定
const stampTable = glide.table({
    token: "630d3d15-b31b-48dd-8938-3a7ac40a6310",
    app: "b2Ps68iDJmpTVBfsXJdE",
    table: "スタンプラリー202508", // ★ここがGlideのシート名と1文字でも違うと500エラーになります
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

    const { email, qrData } = req.body;

    try {
        console.log("重複チェック開始:", email, qrData);
        
        // 1. 既存データの取得を試みる
        let rows;
        try {
            rows = await stampTable.get();
        } catch (getErr) {
            // ここで失敗する場合、テーブル名かトークンが間違っています
            return res.status(500).json({ 
                success: false, 
                message: "Glideテーブルへのアクセスに失敗しました。テーブル名やトークンを確認してください。",
                detail: getErr.message 
            });
        }

        // 2. 重複チェック
        const isDuplicate = rows.some(row => 
            row.userSEMail === email && (row.qr === qrData || row.spot === qrData)
        );

        if (isDuplicate) {
            return res.status(200).json({ success: false, duplicate: true });
        }

        // 3. 行の追加を試みる
        await stampTable.add({
            userSEMail: email,
            qr: qrData,
            spot: qrData,
            timestamp: new Date()
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('API全体の内部エラー:', error);
        return res.status(500).json({ 
            success: false, 
            message: "API内部で予期せぬエラーが発生しました。",
            detail: error.message 
        });
    }
}
