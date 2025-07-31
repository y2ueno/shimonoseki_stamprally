import { google } from 'googleapis';

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', 'https://y2ueno.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { return res.status(200).end(); }
    if (req.method !== 'POST') { return res.status(405).end(); }

    const { userEmail, scannedQrData } = req.body;

    if (!userEmail || !scannedQrData) {
        return res.status(400).json({ message: 'データが不足しています。' });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // ↓↓↓↓↓↓【重要】ご自身のスプレッドシートIDに書き換えてください↓↓↓↓↓↓
        const spreadsheetId = '1loWqEoGPSszUtpEeFBN6HjKFz1_bz9Ig7rEx5gyA7Hw';
        // ↑↑↑↑↑↑【重要】ご自身のスプレッドシートIDに書き換えてください↑↑↑↑↑↑

        // --- 検証ステップ1：有効なQRコードかチェック ---
        // 'Stamp_Spot'シートのA列から有効なSpot IDの一覧を取得します
        const getSpotsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Stamp_Spot!A:A', 
        });
        const validSpotIds = new Set((getSpotsResponse.data.values || []).flat());

        // スキャンされたコードが有効なIDリストに含まれているか確認
        if (!validSpotIds.has(scannedQrData)) {
            return res.status(400).json({ message: '無効なQRコードです。スタンプラリーの対象ではありません。' });
        }

        // --- 検証ステップ2：重複スキャンかチェック ---
        // 'スタンプラリー202508'シートから過去の記録を取得
        const getStampsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'スタンプラリー202508!C:D', // C列(User Email)とD列(Spot ID)を読む
        });
        const existingStamps = getStampsResponse.data.values || [];
        const hasAlreadyScanned = existingStamps.some(
            row => row[0] === userEmail && row[1] === scannedQrData
        );

        if (hasAlreadyScanned) {
            return res.status(400).json({ message: 'このスタンプは既に取得済みです。' });
        }

        // --- 検証を通過した場合、書き込み処理を実行 ---
        const writeRange = 'スタンプラリー202508';
        const uniqueRowId = `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRow = [
            scannedQrData,               // A列: 取得QRコード
            new Date().toISOString(),    // B列: Timestamp
            userEmail,                   // C列: User Email
            scannedQrData,               // D列: Spot ID
            '',                          // E列: RawJSONPayload
            uniqueRowId,                 // F列: Row ID
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: writeRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newRow],
            },
        });

        res.status(200).json({ message: 'スタンプをゲットしました！' });

    } catch (error) {
        console.error('Error in Vercel function:', error);
        res.status(500).json({ message: 'サーバーでエラーが発生しました。' });
    }
}
