document.addEventListener('DOMContentLoaded', () => {
    const userEmailDisplay = document.getElementById('user-email-display');
    const resultsDisplay = document.getElementById('qr-reader-results');
    
    // 1. URLからユーザーEmailを取得し表示
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('userEmail');

    if (!userEmail) {
        userEmailDisplay.textContent = '参加者情報が取得できませんでした';
        resultsDisplay.textContent = 'アプリから再度お試しください。';
        resultsDisplay.className = 'error';
        return;
    }
    userEmailDisplay.textContent = `参加者: ${userEmail}`;

    // 2. スキャナーの初期化
    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // 3. スキャン成功時のコールバック関数
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // スキャン成功音を鳴らす（任意）
        // new Audio('success.mp3').play();
        
        // スキャナーを停止
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning is stopped.");
            resultsDisplay.textContent = 'サーバーにスタンプ情報を送信中...';
            resultsDisplay.className = 'info';
            // サーバーにデータを送信
            sendDataToServer(userEmail, decodedText);
        }).catch(err => {
            console.error("Failed to stop the scanner.", err);
        });
    };

    // 4. スキャナーを開始
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            resultsDisplay.textContent = 'カメラの起動に失敗しました。権限を確認してください。';
            resultsDisplay.className = 'error';
            console.error("Unable to start scanning.", err);
        });
});

// 5. セキュリティサーバーへデータを送信する関数
async function sendDataToServer(email, qrData) {
    const resultsDisplay = document.getElementById('qr-reader-results');
    // ⚠️ 必ず自身のGoogle Cloud FunctionのトリガーURLに置き換えてください
    const serverUrl = 'https://<YOUR_SECURITY_SERVER_URL>'; 

    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: email,
                scannedQrData: qrData, // QRコードの中身（SPOT Row ID）
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
