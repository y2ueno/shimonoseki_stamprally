// scanner.js (詳細デバッグ版)
function onScanSuccess(decodedText, decodedResult) {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    if (!userEmail) { alert("メールアドレスなし"); return; }

    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().catch(e => console.error(e));
    }

    const VERCEL_API_URL = 'https://shimonoseki-stamprally.vercel.app/api';

    fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, qrData: decodedText })
    })
    .then(async response => {
        // ここでエラー番号を確実に取得します
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`【サーバーエラー】\n番号: ${response.status}\n内容: ${errorText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.duplicate) alert("取得済みです");
        else if (data.success) alert(`獲得: ${decodedText}`);
        window.location.reload();
    })
    .catch(error => {
        // ここで詳細をアラートに出します
        alert("詳細エラー報告:\n" + error.message);
        window.location.reload();
    });
}
