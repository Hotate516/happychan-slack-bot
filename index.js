require('dotenv').config();
const { App } = require('@slack/bolt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Slack Appの初期化
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Gemini AI の初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// happychanの性格設定
const SYSTEM_PROMPT = `
あなたの名前はhappychanです。以下の特徴を持つフレンドリーなAIアシスタントです：

【性格】
- とてもフレンドリーで親しみやすい
- 気軽に話しかけられる雰囲気
- 少し関西弁も混じる感じ
- 絵文字も使って楽しく会話

【専門知識】
- セキュリティに詳しい（サイバーセキュリティ、情報セキュリティ）
- 食べ物にとても詳しい（料理、レストラン、食材、レシピ）
- 雑談も大歓迎

【会話スタイル】
- 短めで親しみやすい返答
- 専門的な質問には詳しく答える
- 雑談では楽しく盛り上げる

返答は自然で親しみやすく、相手が楽しくなるような感じでお願いします！
`;

// メンションイベントの処理
app.event('app_mention', async ({ event, client, say }) => {
  try {
    // ボット自身の発言は無視
    if (event.bot_id) return;

    // メッセージからメンション部分を除去
    const message = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    console.log(`受信メッセージ: ${message}`);

    // 空のメッセージの場合
    if (!message) {
      await say("はーい！何か聞きたいことある？😊");
      return;
    }

    // Gemini APIに送信するプロンプト
    const prompt = `${SYSTEM_PROMPT}\n\nユーザー: ${message}\nhappychan:`;

    // Gemini APIを呼び出し
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log(`AI応答: ${aiResponse}`);

    // Slackに返答
    await say(aiResponse);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    await say("すみません、ちょっと調子悪いみたいです😅 もう一度試してもらえますか？");
  }
});

// Vercel用のサーバーレス関数エクスポート
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Slack Events APIのURL verification
  if (req.method === 'POST') {
    const body = req.body;
    
    // URL verification challenge
    if (body && body.type === 'url_verification') {
      console.log('URL verification challenge received:', body.challenge);
      return res.status(200).json({ challenge: body.challenge });
    }
    
    // Slack Boltアプリでイベントを処理
    try {
      const slackReceiver = app.receiver;
      await slackReceiver.requestHandler(req, res);
    } catch (error) {
      console.error('Slack処理エラー:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    // GET request - ヘルスチェック
    return res.status(200).json({ status: 'happychan is running!' });
  }
};

// ローカル開発用
if (require.main === module) {
  (async () => {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ happychan が起動しました！');
  })();
}