/**
 * scanner.js - 2026/01/17 最終・完全同期版
 */
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyZMbnDawZNUIs0aKk8KHKjhfVylUbKRuG9e2z__PwTJ7lcoEUGbUnQy10RiXl0EnCnZg/exec';

let html5QrCode;

window.addEventListener('DOMContentLoaded', () => {
    html5QrCode = new Html5Qrcode("qr-reader");
    showStartScreen();
});

function showStartScreen() {
    const readerElement = document.getElementById('qr-reader');
    readerElement.innerHTML = `<div id="start-screen" style="text-align:center; padding: 40px 20px;"><button id="custom-start-btn" style="background-color: #1a237e; color: white; border: none; padding: 18px 36px; border-radius: 50px; font-weight: bold; font-size: 18px; cursor: pointer;">📷 スキャンを開始</button></div>`;
    document.getElementById('custom-start-btn').addEventListener('click', startScanning);
}

function startScanning() {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    document.getElementById('qr-reader').innerHTML = ""; 
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (err) => {}).catch(err => {
        alert("カメラ起動エラー");
        showStartScreen();
    });
}

function onScanSuccess(decodedText) {
    const urlParams = new URLSearchParams(window.location.search);
    const staffEmail = urlParams.get('staff_email'); // スタッフ用URLのみ入っている
    const userEmail = urlParams.get('email');       // ユーザー用URLに入っている

    let payload = { qrData: decodedText };

    // --- ここで明確に役割を分ける ---
    if (staffEmail) {
        // スタッフ用（景品交換）
        if (!staffEmail.includes('@')) {
            alert("エラー：スタッフ設定が古いです。アプリをリロードしてください。");
            showStartScreen();
            return;
        }
        payload.staff_email = staffEmail;
    } else if (userEmail) {
        // 一般ユーザー用（スタンプ取得）
        payload.email = userEmail;
    } else {
        alert("エラー：ユーザー情報がありません。アプリから開き直してください。");
        showStartScreen();
        return;
    }

    html5QrCode.stop().then(() => {
        processScan(payload);
    });
}

function processScan(payload) {
    document.getElementById('qr-reader').innerHTML = `<div style="text-align:center; padding:40px;">通信中...</div>`;
    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? "成功しました！" : "エラー: " + (data.message || "失敗しました"));
        showStartScreen();
    })
    .catch(error => {
        alert("通信エラー");
        showStartScreen();
    });
}
