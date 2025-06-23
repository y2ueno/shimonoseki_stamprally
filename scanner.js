// scanner.js (emailパラメータ対応版)

document.addEventListener('DOMContentLoaded', () => {
    const userEmailDisplay = document.getElementById('user-email-display');
    const resultsDisplay = document.getElementById('qr-reader-results');
    
    // ↓↓↓↓↓↓ ここを 'userEmail' から 'email' に変更しました ↓↓↓↓↓↓
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email'); // 'userEmail' から 'email' に変更
    // ↑↑↑↑↑↑ ここを 'userEmail' から 'email' に変更しました ↑↑↑↑↑↑

    if (!email) {
        userEmailDisplay.textContent = '参加者情報が取得できませんでした';
        resultsDisplay.textContent = 'アプリから再度お試しください。';
        resultsDisplay.className = 'error';
        return;
    }
    userEmailDisplay.textContent = `参加者: ${email}`;

    // (これ以降のコードは変更ありません)

    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning is stopped.");
            resultsDisplay.textContent = 'サーバーにスタンプ情報を送信中...';
            resultsDisplay.className = 'info';
            sendDataToServer(email, decodedText);
        }).catch(err => {
            console.error("Failed to stop the scanner.", err);
        });
    };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            resultsDisplay.textContent = 'カメラの起動に失敗しました。権限を確認してください。';
            resultsDisplay.className = 'error';
            console.error("Unable to start scanning.", err);
        });
});

async function sendDataToServer(email, qrData) {
    const resultsDisplay = document.getElementById('qr-reader-results');
    const serverUrl = 'https://<YOUR_PROJECT_NAME>.vercel.app/api'; 

    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                userEmail: email, // 送信するJSONのキーは 'userEmail' のままでOKです
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
