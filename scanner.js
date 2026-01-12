/**
 * scanner.js
 * 第2回 からまちスタンプラリー (202508) 専用
 * スキャン結果を Vercel API 経由で Glide Tables へ記録します
 */

// --- 設定エリア ---
// あなたの Vercel プロジェクトの API エンドポイント URL
const VERCEL_API_URL = 'https://shimonoseki-stamprally.vercel.app/api';

/**
 * QRコードスキャン成功時のコールバック関数
 */
function onScanSuccess(decodedText, decodedResult) {
    // 1. URLクエリパラメータから参加者のメールアドレスを取得
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    // メールアドレスがない場合はエラーを表示して中断
    if (!userEmail) {
        alert("エラー：参加者情報（メールアドレス）が不足しています。アプリのスタンプラリー画面から再度開き直してください。");
        return;
    }

    console.log(`スキャン成功: ${decodedText}`);

    // 2. 多重送信を防ぐためにスキャナーを一時停止（クリア）
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().catch(err => {
            console.error("スキャナーの停止に失敗しました:", err);
        });
    }

    // 3. Vercel API へデータを送信
    // ボディには参加者のメールアドレスと読み取ったQRコードのテキストを含める
    // scanner.js の fetch 部分を以下に差し替え
fetch(VERCEL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, qrData: decodedText })
})
.then(response => {
    // エラー番号をアラートに出すように変更
    if (!response.ok) {
        throw new Error('サーバーエラー発生: ステータスコード ' + response.status);
    }
    return response.json();
})
// ...（以下はそのまま）
    .then(response => {
        if (!response.ok) {
            throw new Error('ネットワーク応答が正常ではありませんでした。');
        }
        return response.json();
    })
    .then(data => {
        // 4. API からのレスポンスに基づいたメッセージ表示
        if (data.duplicate) {
            // すでに取得済みのスタンプだった場合
            alert("このスポットのスタンプはすでに取得済みです。");
        } else if (data.success) {
            // 新規取得に成功した場合
            alert(`スタンプ「${decodedText}」を獲得しました！`);
        } else {
            // API側で何らかのエラーが発生した場合
            alert("エラーが発生しました: " + (data.message || "不明なエラー"));
        }

        // 次のスキャンのためにページをリロードして状態をリセット
        window.location.reload();
    })
    // scanner.js の catch 部分を一時的に以下に変更
.catch(error => {
    console.error('Error Details:', error);
    // 汎用的なメッセージではなく、errorの中身を直接表示させる
    alert("詳細エラー報告:\n" + error.name + ": " + error.message);
    window.location.reload();
});
}

/**
 * QRコードスキャン失敗時（読み取り中）のコールバック
 * (頻繁に呼ばれるため、基本は何も処理しない)
 */
function onScanFailure(error) {
    // console.warn(`QRコード読み取り中...`);
}

/**
 * ページ読み込み完了時にスキャナーを起動
 */
window.addEventListener('DOMContentLoaded', () => {
    // インスタンスをグローバル変数に保持
    window.html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10,           // 1秒間に10回スキャン試行
            qrbox: { width: 250, height: 250 }, // スキャンエリアのサイズ
            rememberLastUsedCamera: true         // 最後に使ったカメラを記憶
        }
    );
    
    // スキャナーの描画開始
    window.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});
