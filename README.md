# happychan 🤖

フレンドリーでセキュリティと食べ物に詳しいSlack AIチャットボット

## 概要

happychanは、Slack上で動作するAIチャットボットです。親しみやすい性格で、セキュリティや食べ物に関する質問から日常的な雑談まで幅広く対応します。

## 特徴

- 🗣️ **フレンドリーな性格**: 親しみやすい会話
- 🔐 **セキュリティ専門知識**: サイバーセキュリティや情報セキュリティに詳しい
- 🍜 **食べ物の知識**: 料理、レストラン、食材、レシピに詳しい
- 💬 **雑談対応**: 気軽な会話から専門的な質問まで対応
- ⚡ **高速レスポンス**: Vercelサーバーレス関数による高速処理

## 技術スタック

- **AI Engine**: Google Gemini 1.5 Flash
- **Platform**: Slack (Events API)
- **Runtime**: Node.js
- **Deploy**: Vercel (サーバーレス関数)
- **Language**: JavaScript

## 使い方

Slackチャンネルでhappychanをメンションするだけ：

```
@happychan こんにちは！
@happychan セキュリティについて教えて
@happychan 今日のおすすめ料理は？
@happychan 疲れた〜
```

## セットアップ

### 前提条件

- Node.js 18+
- Slack ワークスペースの管理者権限
- Google AI Studio アカウント
- Vercel アカウント

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成：

```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Slack App設定

1. [Slack API](https://api.slack.com/apps) でアプリを作成
2. Bot Token Scopes を設定：
   - `chat:write`
   - `app_mentions:read`
   - `channels:read`
3. Event Subscriptions を有効化：
   - Request URL: `https://your-domain.vercel.app/api/slack`
   - Subscribe to bot events: `app_mention`

### 4. Vercelにデプロイ

```bash
# Vercel CLIでデプロイ
vercel

# または GitHub連携で自動デプロイ
git push origin main
```

### 5. 環境変数をVercelに設定

Vercel Dashboard > Settings > Environment Variables で以下を設定：
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `GEMINI_API_KEY`

## プロジェクト構造

```
happychan-slack-bot/
├── api/
│   └── slack.js          # Slack Events API ハンドラー
├── .env                  # 環境変数（ローカル開発用）
├── .gitignore           # Git無視ファイル
├── package.json         # 依存関係
├── vercel.json          # Vercel設定
└── README.md           # このファイル
```

## 開発

### ローカル開発

```bash
# 開発サーバー起動
npm run dev

# ngrokでローカルサーバーを公開（テスト用）
npx ngrok http 3000
```

### ログ確認

Vercel Dashboard > Functions でリアルタイムログを確認可能

## カスタマイズ

### 性格の調整

`api/slack.js` の `SYSTEM_PROMPT` を編集：

```javascript
const SYSTEM_PROMPT = `
あなたの名前はhappychanです。
// ここで性格や専門知識を自由にカスタマイズ
`;
```

### 新機能の追加

- ファイルアップロード対応
- スレッド返信
- リアクション機能
- 定期投稿機能

## トラブルシューティング

### よくある問題

**Q: "challenge parameter" エラーが出る**
A: Request URLが正しく設定されているか確認。`/api/slack` が必要

**Q: ボットが反応しない**
A: Event Subscriptions の `app_mention` イベントが設定されているか確認

**Q: AI応答でエラーが出る**
A: Gemini API キーが正しく設定されているか確認

### ログの確認方法

```bash
# Vercel CLI でログ確認
vercel logs

# または Vercel Dashboard で確認
```

## ライセンス

MIT License

## 作成者

Hotaku Komatsu

---

**happychanと楽しい会話を！** 😊