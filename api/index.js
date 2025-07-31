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
        return res.status(400).json({ message: 'Missing data.' });
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

        const range = 'スタンプラリー202508';

        const uniqueRowId = `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;

        const newRow = [
            scannedQrData,
            new Date().toISOString(),
            userEmail,
            scannedQrData,
            '',
            uniqueRowId,
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newRow],
            },
        });

        res.status(200).json({ message: 'Successfully added stamp.' });

    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
}
