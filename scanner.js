/**
 * scanner.js
 * Google Apps Script (GAS) 連携版
 * 権限許可の再要求を防ぐため、リロード(reload)を回避したバージョン
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

    // 2. 二重読み取り防止のため、一旦スキャナーを停止
    // clear()を実行するとカメラが止まるため、後ほど再開させます
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().then(() => {
            processScan(decodedText, userEmail);
        }).catch(err => {
            console.error("スキャナー停止エラー:", err);
        });
    }
}

/**
 * GASへのデータ送信とスキャナーの再開処理
 */
function processScan(qrData, email) {
    // 3. GAS (Google Apps Script) へデータを送信
    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
            email: email,
            qrData: qrData
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('ネットワーク応答が正常ではありませんでした。');
        }
        return response.json();
    })
    .then(data => {
        // 4. GAS側からのレスポンスに応じたアラート表示
        if (data.duplicate) {
            alert("このスポットのスタンプはすでに取得済みです。");
        } else if (data.success) {
            alert(`スタンプ「${qrData}」を獲得しました！`);
        } else {
            alert("エラーが発生しました: " + (data.message || "不明なエラー"));
        }

        // 5. 【重要】リロードせずにスキャナーを再起動
        // これにより、ブラウザの権限チェックをスキップしてカメラを再開できる可能性が高まります
        restartScanner();
    })
    .catch(error => {
        console.error('通信エラー:', error);
        alert("通信エラーが発生しました。電波の良い場所で再度お試しください。");
        restartScanner();
    });
}

/**
 * スキャナーを再起動する関数
 */
function restartScanner() {
    console.log("スキャナーを再起動します...");
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }
}

/**
 * スキャン失敗時（スキャン中）の処理
 */
function onScanFailure(error) {
    // 読み取り中は何も出力しない
}

/**
 * ページ読み込み完了時にスキャナーをセットアップ
 */
window.addEventListener('DOMContentLoaded', () => {
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
    
    // 初回レンダリング
    window.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
