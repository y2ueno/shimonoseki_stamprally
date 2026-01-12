/**
 * scanner.js
 * Google Apps Script (GAS) 連携版
 * 第2回 からまちスタンプラリー (202508)
 */

// --- 設定エリア ---
// あなたの GAS ウェブアプリの URL
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw-teQvWo5FZpUXPKdoxpYivXaRc-XEdQkI4tIDV8bzFP5r4G-HbjSYa1o2WLuF2gTtkQ/exec';

/**
 * QRコードスキャン成功時のコールバック
 */
function onScanSuccess(decodedText, decodedResult) {
    // 1. URLパラメータからメールアドレスを取得
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        alert("エラー：参加者のメールアドレスが取得できません。アプリから開き直してください。");
        return;
    }

    console.log(`QR読み取り成功: ${decodedText}`);

    // 2. 二重送信防止のためスキャナーを停止
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().catch(err => {
            console.error("スキャナー停止エラー:", err);
        });
    }

    // 3. GAS (Google Apps Script) へデータを送信
    // GASのdoPostで処理するため、POSTメソッドでJSONを送信します
    fetch(GAS_API_URL, {
        method: 'POST',
        // GASは CORS の関係で標準的な JSON 送信を行うために、bodyに文字列を渡します
        body: JSON.stringify({
            email: userEmail,
            qrData: decodedText
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('ネットワーク応答が正常ではありませんでした。');
        }
        return response.json();
    })
    .then(data => {
        // 4. GAS側からのレスポンス（duplicate/success）に応じたアラート表示
        if (data.duplicate) {
            alert("このスポットのスタンプはすでに取得済みです。");
        } else if (data.success) {
            alert(`スタンプ「${decodedText}」を獲得しました！`);
        } else {
            alert("エラーが発生しました: " + (data.message || "不明なエラー"));
        }

        // 5. 状態をリセットするためにページをリロード
        window.location.reload();
    })
    .catch(error => {
        console.error('通信エラー:', error);
        alert("通信エラーが発生しました。電波の良い場所で再度お試しください。");
        window.location.reload();
    });
}

/**
 * スキャン失敗時（スキャン中）の処理
 */
function onScanFailure(error) {
    // 読み取り中はコンソールを汚さないため何もしない
}

/**
 * ページ読み込み完了時にスキャナーをセットアップ
 */
window.addEventListener('DOMContentLoaded', () => {
    // URLからメールアドレスを取得して画面に表示（確認用）
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    const displayEl = document.getElementById('user-email-display');
    if (displayEl && userEmail) {
        displayEl.innerText = `参加者: ${userEmail}`;
    }

    // スキャナーの初期化
    window.html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        }
    );
    
    // レンダリング開始
    window.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
