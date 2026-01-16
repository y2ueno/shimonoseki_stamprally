/**
 * scanner.js
 * Google Apps Script (GAS) 連携版 
 * UIカスタマイズ版：ライブラリ標準の「青い許可ボタン」を回避し、自前ボタンで起動する
 */

// --- 設定エリア ---
// あなたの GAS ウェブアプリの URL
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw-teQvWo5FZpUXPKdoxpYivXaRc-XEdQkI4tIDV8bzFP5r4G-HbjSYa1o2WLuF2gTtkQ/exec';

let html5QrCode; // スキャナーのインスタンス保持用

/**
 * ページ読み込み完了時に実行
 */
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    // ユーザー名の表示（もしHTMLに要素があれば）
    const displayEl = document.getElementById('user-email-display');
    if (displayEl && userEmail) {
        displayEl.innerText = `参加者: ${userEmail}`;
    }

    // 1. UIなしの低層クラス「Html5Qrcode」を初期化
    html5QrCode = new Html5Qrcode("qr-reader");

    // 2. 初期画面（スキャン開始ボタン）を表示
    showStartScreen();
});

/**
 * 初期の「スキャン開始」画面を表示する
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
            <p style="font-size: 13px; color: #666; margin-top: 20px; line-height: 1.5;">
                ボタンを押してカメラを起動してください<br>
                <span style="font-size: 11px;">※カメラの許可を求められたら「許可」を選択してください</span>
            </p>
        </div>
    `;

    document.getElementById('custom-start-btn').addEventListener('click', startScanning);
}

/**
 * カメラの起動とスキャンの開始
 */
function startScanning() {
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
    };

    // ボタンを消して「読み取り中...」の表示にする（必要に応じて）
    document.getElementById('qr-reader').innerHTML = ""; 

    html5QrCode.start(
        { facingMode: "environment" }, // 背面カメラを使用
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("カメラ起動エラー:", err);
        alert("カメラの起動に失敗しました。ブラウザの設定でカメラ許可が「拒否」になっていないか確認してください。");
        showStartScreen(); // 失敗したらボタン画面に戻す
    });
}

/**
 * スキャン成功時の処理
 */
function onScanSuccess(decodedText, decodedResult) {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        alert("エラー：参加者のメールアドレスが取得できません。アプリから開き直してください。");
        return;
    }

    console.log(`QR読み取り成功: ${decodedText}`);

    // 二重送信防止のため一旦停止
    html5QrCode.stop().then(() => {
        processScan(decodedText, userEmail);
    }).catch(err => {
        console.error("スキャン停止エラー:", err);
    });
}

/**
 * GASへのデータ送信
 */
function processScan(qrData, email) {
    // 読み込み中表示
    document.getElementById('qr-reader').innerHTML = `<div style="text-align:center; padding:40px;">送信中...</div>`;

    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({
            email: email,
            qrData: qrData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.duplicate) {
            alert("このスポットのスタンプはすでに取得済みです。");
        } else if (data.success) {
            alert(`スタンプ「${qrData}」を獲得しました！`);
        } else {
            alert("エラーが発生しました: " + (data.message || "不明なエラー"));
        }
        // ボタン画面に戻す（リロードせず再開可能にする）
        showStartScreen();
    })
    .catch(error => {
        console.error('通信エラー:', error);
        alert("通信エラーが発生しました。電波の良い場所で再度お試しください。");
        showStartScreen();
    });
}

/**
 * スキャン失敗時（読み取り中）の処理
 */
function onScanFailure(error) {
    // 読み取り中の軽微なエラーは無視
}
