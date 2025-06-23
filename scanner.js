// scanner.js (最新版)

document.addEventListener('DOMContentLoaded', () => {
    const userEmailDisplay = document.getElementById('user-email-display');
    const resultsDisplay = document.getElementById('qr-reader-results');
    
    // 1. URLパラメータからユーザーのEmailを取得し、画面に表示します
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('userEmail');

    if (!userEmail) {
        userEmailDisplay.textContent = '参加者情報が取得できませんでした';
        resultsDisplay.textContent = 'アプリから再度お試しください。';
        resultsDisplay.className = 'error';
        return;
    }
    userEmailDisplay.textContent = `参加者: ${userEmail}`;

    // 2. QRコードリーダーを初期化します
    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // 3. スキャンが成功したときの処理を定義します
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // スキャナーを停止して、カメラをオフにします
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning is stopped.");
            resultsDisplay.textContent = 'サーバーにスタンプ情報を送信中...';
            resultsDisplay.className = 'info';
            
            // サーバーにスキャンデータを送信します
            sendDataToServer(userEmail, decodedText);

        }).catch(err => {
            console.error("Failed to stop the scanner.", err);
        });
    };

    // 4. スキャナーを開始します
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            resultsDisplay.textContent = 'カメラの起動に失敗しました。権限を確認してください。';
            resultsDisplay.className = 'error';
            console.error("Unable to start scanning.", err);
        });
});

/**
 * 取得したデータをVercel上のセキュリティサーバーに送信する関数
 * @param {string} email - ユーザーのEmailアドレス
 * @param {string} qrData - QRコードから読み取ったデータ（SpotのRow ID）
 */
async function sendDataToServer(email, qrData) {
    const resultsDisplay = document.getElementById('qr-reader-results');
    
    // ↓↓↓↓↓↓【重要】ご自身のVercelのURLに必ず書き換えてください↓↓↓↓↓↓
    const serverUrl = 'https://shimonoseki-stamprally.vercel.app//api'; 
    // 例: https://glide-qr-scanner-tanaka.vercel.app/api

    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userEmail: email,
                scannedQrData: qrData,
            }),
        });

        if (response.ok) {
            resultsDisplay.textContent = 'スタンプをゲットしました！🎉 このページを閉じてください。';
            resultsDisplay.className = 'success';
        } else {
            const error = await response.json();
            resultsDisplay.textContent = `エラー: ${error.message || '登録に失敗しました'}`;
            resultsDisplay.className = 'error';
        }
    } catch (error) {
        console.error('Error:', error);
        resultsDisplay.textContent = 'サーバー通信エラー。管理者に連絡してください。';
        resultsDisplay.className = 'error';
    }
}
