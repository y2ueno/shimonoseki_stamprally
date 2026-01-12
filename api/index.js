import * as glide from "@glideapps/tables";

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
    // --- CORS 設定ここから ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // すべてのドメインからのアクセスを許可
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // --- CORS 設定ここまで ---

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { email, qrData } = req.body;

    try {
        const rows = await stampTable.get();
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
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Failed to record stamp' });
    }
}
