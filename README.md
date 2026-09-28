> 公開用スナップショットです。実データ、認証情報、運用環境の識別子は含めていません。

# FIVE BOMBER Web

PCブラウザ向けの3〜6人用爆弾クイズゲームです。設定は「参加人数・名前・片道/往復」だけに絞り、ゲーム本編は1920×1080のCanvasステージで動作します。外部APIや実行時CDNは使いません。

## 必要環境

- Node.js 20以上（ローカルサーバー、build、testにのみ使用）
- Canvas / Web Audio / Fullscreen API対応のPCブラウザ

依存packageはありません。`npm install` は不要です。

## 起動方法

PowerShellでは次を実行し、表示されたURLをPCブラウザで開きます。

```powershell
node scripts/serve.mjs
```

標準URLは `http://127.0.0.1:4173` です。別portを使う場合は `$env:PORT=8080` のように指定できます。ブラウザの制約上、音声は「ゲームスタート」を押した後に有効になります。

## 遊び方

1. 参加人数（3〜6人）を選びます。初期値は5人です。
2. 必要なら名前を変更します。空欄は自動で `PLAYER N` になります。
3. 片道または往復を選び、「ゲームスタート」を押します。
4. 司会者が回答を判定し、「正解」「不正解」を押します。キーボードは `O`（正解）、`X`（不正解）です。
5. 正解すると爆弾が次の回答位置へ移ります。全員分を通過するとクリア、30秒経過すると爆発してゲームオーバーです。

「問題編集」は通常設定から分離されています。1行を `問題文|答え` の形式で編集します。設定と問題はLocalStorageへ保存されます。「初期設定に戻す」で人数5人・片道へ戻せます。ゲーム画面右上から全画面表示と音のON/OFFを切り替えられます。

## build / test

```powershell
node scripts/check.mjs
node --test
node --test test/e2e.test.js
node scripts/build.mjs
```

まとめて検証する場合は `npm.cmd run check` も利用できます。build成果物は `dist/` です。本番相当の静的配信では `dist/` 全体を同一originで配信してください。SPA rewriteやbackendは不要です。

## 構成

- `src/core.js`: 人数、回答順、パイプ座標、ゲーム状態遷移
- `src/renderer.js`: Canvas背景、パイプ、爆弾、移動、爆発、フラッシュ
- `src/audio.js`: BGM/SE制御と交換可能な仮音源
- `src/storage.js`: 設定・問題のLocalStorage保存と破損時fallback
- `src/questions.js`: 標準問題と編集形式
- `src/config.js`: animation時間、基準解像度、色、保存key
- `src/app.js`: DOM、入力、タイマー、画面進行、fullscreen
- `test/`: unit / integration / state-based E2E tests
- `docs/`: 参考作品調査、asset状況、既知の差異

## PWA / offline

初回読み込み後はservice workerがアプリshellをcacheします。更新時に古いcacheを削除します。ブラウザからインストール可能ですが、PCブラウザでの通常利用が主対象です。

## 参考作品と権利上の注意

指定されたScratch作品の `.sb3` や第三者の画像・音声は、この隔離workspaceには含まれていません。今回の実行条件では外部アクセスも禁止されたため取得していません。見た目は仕様書に記載された構成をもとにコード描画し、音は動作確認用の合成キューです。公開前に権利確認済み素材へ差し替える場合は [asset調査結果](docs/ASSET_MANIFEST.md) と [既知の差異](docs/KNOWN_DIFFERENCES.md) を参照してください。
