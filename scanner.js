/**
 * scanner.js
 * 参加者情報の取得からスキャナーの起動、API送信までをすべて含みます
 */

const VERCEL_API_URL = 'https://shimonoseki-stamprally.vercel.app/api';

/**
 * QRコードスキャン成功時の処理
 */
async function onScanSuccess(decodedText, decodedResult) {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        alert("エラー：URLにemailが含まれていません。アプリから開き直してください。");
        return;
    }

    // 二重送信防止のため停止
    if (window.html5QrcodeScanner) {
        await window.html5QrcodeScanner.clear().catch(e => console.error(e));
    }

    console.log("スキャン成功:", decodedText);

    // Vercel APIへ送信
    fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, qrData: decodedText })
    })
    .then(async response => {
        // ここでエラー番号を確実に取得します
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`番号: ${response.status}\n内容: ${errorText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.duplicate) {
            alert("このスポットのスタンプはすでに取得済みです。");
        } else if (data.success) {
            alert(`スタンプ「${decodedText}」を獲得しました！`);
        } else {
            alert("記録に失敗しました: " + (data.message || "不明なエラー"));
        }
        window.location.reload();
    })
    .catch(error => {
        alert("詳細エラー報告:\n" + error.message);
        window.location.reload();
    });
}

/**
 * 読み取り失敗時（無視してOK）
 */
function onScanFailure(error) {
    // console.warn(error);
}

/**
 * 【重要】ページが読み込まれたらスキャナーを起動する設定
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log("スキャナー初期化中...");
    
    // index.html の email 表示部分を更新（もし存在すれば）
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    const displayEl = document.getElementById('user-email-display');
    if (displayEl) {
        displayEl.innerText = userEmail ? `参加者: ${userEmail}` : "参加者情報がありません";
    }

    // スキャナーの起動
    window.html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        }
    );
    window.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
