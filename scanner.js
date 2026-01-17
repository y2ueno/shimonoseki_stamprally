/**
 * scanner.js (防御型・最終版)
 * パラメータ名の不一致や、古いRow IDの送信を自動で検知・修正するバージョン
 */

// --- 設定エリア ---
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw-teQvWo5FZpUXPKdoxpYivXaRc-XEdQkI4tIDV8bzFP5r4G-HbjSYa1o2WLuF2gTtkQ/exec';

let html5QrCode;

/**
 * ページ読み込み完了時に実行
 */
window.addEventListener('DOMContentLoaded', () => {
    html5QrCode = new Html5Qrcode("qr-reader");
    
    // 現在のパラメータ状態をコンソールで確認（デバッグ用）
    const urlParams = new URLSearchParams(window.location.search);
    console.log("Current Params:", Object.fromEntries(urlParams));

    showStartScreen();
});

/**
 * 初期の「スキャン開始」画面を表示
 */
function showStartScreen() {
    const readerElement = document.getElementById('qr-reader');
    readerElement.innerHTML = `
        <div id="start-screen" style="text-align:center; padding: 40px 20px; font-family: sans-serif;">
            <button id="custom-start-btn" style="
                background-color: #1a237e; color: white; border: none; 
                padding: 18px 36px; border-radius: 50px; font-weight: bold; font-size: 18px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3); cursor: pointer;">
                📷 スタンプを読み取る
            </button>
            <p style="font-size: 13px; color: #666; margin-top: 20px;">
                ボタンを押してカメラを起動してください
            </p>
        </div>
    `;
    document.getElementById('custom-start-btn').addEventListener('click', startScanning);
}

/**
 * カメラの起動
 */
function startScanning() {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    document.getElementById('qr-reader').innerHTML = ""; 

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        alert("カメラ起動エラー。設定を確認してください。");
        showStartScreen();
    });
}

/**
 * スキャン成功時の処理（ここで送信データを徹底チェック）
 */
function onScanSuccess(decodedText) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 【重要】新旧どちらのパラメータ名でも取得できるようにする
    // かつ、どちらも無い場合は「不明なスタッフ」として処理せずエラーを出す
    let staffEmail = urlParams.get('staff_email') || urlParams.get('email');

    // 【重要】値がメールアドレス形式（@を含む）かチェック
    // もし Row ID (英数字のみ) が送られてきた場合は、ここでブロックする
    if (!staffEmail || !staffEmail.includes('@')) {
        const errorMsg = "スタッフ情報（メールアドレス）が正しくありません。アプリを一度閉じて開き直してください。";
        console.error(errorMsg, "Received Value:", staffEmail);
        alert(errorMsg);
        showStartScreen();
        return;
    }

    console.log(`送信準備: Staff=${staffEmail}, QR=${decodedText}`);

    html5QrCode.stop().then(() => {
        processScan(decodedText, staffEmail);
    });
}

/**
 * GASへのデータ送信
 */
function processScan(qrData, staffEmail) {
    document.getElementById('qr-reader').innerHTML = `<div style="text-align:center; padding:40px;">記録中...</div>`;

    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
            staff_email: staffEmail, // 正しいEmailを確実に送る
            qrData: qrData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.duplicate) {
            alert("このQRコードは既に処理済みです。");
        } else if (data.success) {
            alert(`スキャン成功：${qrData}`);
        } else {
            alert("エラー: " + (data.message || "不明なエラー"));
        }
        showStartScreen();
    })
    .catch(error => {
        alert("通信エラーが発生しました。");
        showStartScreen();
    });
}

function onScanFailure(error) {}
