require('dotenv').config();
const { App } = require('@slack/bolt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Slack Appの初期化
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
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
- 適度に関西弁を使う（「やで」「やん」「めっちゃ」など）

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

// Vercel用のエクスポート（サーバーレス関数として動作）
module.exports = async (req, res) => {
  // Slack Events APIのURL verification
  if (req.method === 'POST' && req.body && req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  
  // Slack Boltのハンドラーに処理を委譲
  const handler = await app.start();
  return handler(req, res);
};

// ローカル開発用
if (require.main === module) {
  (async () => {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ happychan が起動しました！');
  })();
}