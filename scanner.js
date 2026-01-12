/**
 * QRコードスキャン成功時の処理
 */
function onScanSuccess(decodedText, decodedResult) {
    // 1. URLからメールアドレスを取得
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        alert("エラー：参加者情報（メールアドレス）が取得できません。アプリから開き直してください。");
        return;
    }

    // 二重送信防止のためスキャナーを停止
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().catch(err => console.error("Scanner stop error:", err));
    }

    // 2. 自作APIへデータを送信
    fetch('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: userEmail,
            qrData: decodedText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.duplicate) {
            // 重複していた場合
            alert("このスポットのスタンプはすでに取得済みです");
        } else if (data.success) {
            // 新規登録成功
            alert(`スタンプ「${decodedText}」を獲得しました！`);
        } else {
            // その他のエラー
            alert("エラーが発生しました: " + (data.message || "不明なエラー"));
        }
        
        // 画面をリロードしてスキャナーを再準備
        window.location.reload();
    })
    .catch(error => {
        console.error('Fetch Error:', error);
        alert("通信エラーが発生しました。電波の良い場所で再度お試しください。");
        window.location.reload();
    });
}

/**
 * スキャナーの初期化
 */
window.addEventListener('DOMContentLoaded', () => {
    window.html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        }
    );
    window.html5QrcodeScanner.render(onScanSuccess);
});
