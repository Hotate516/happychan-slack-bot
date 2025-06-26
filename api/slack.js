const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Slack signature verification
function verifySlackRequest(body, signature, timestamp) {
  const crypto = require('crypto');
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  
  if (!signingSecret) return false;
  
  const baseString = `v0:${timestamp}:${body}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Slack-Signature, X-Slack-Request-Timestamp');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const parsedBody = typeof req.body === 'string' ? JSON.parse(body) : req.body;

    console.log('Received request:', parsedBody);

    // URL verification challenge
    if (parsedBody.type === 'url_verification') {
      console.log('URL verification challenge:', parsedBody.challenge);
      return res.status(200).json({ challenge: parsedBody.challenge });
    }

    // Slack signature verification
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    
    if (!verifySlackRequest(body, signature, timestamp)) {
      console.log('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Event handling
    if (parsedBody.type === 'event_callback') {
      const event = parsedBody.event;
      
      // Ignore bot messages and message changes
      if (event.bot_id || event.subtype) {
        return res.status(200).json({ ok: true });
      }

      // Handle app mentions
      if (event.type === 'app_mention') {
        // メッセージからメンション部分を除去
        const message = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
        
        console.log(`受信メッセージ: ${message}`);

        let aiResponse;
        
        if (!message) {
          aiResponse = "はーい！何か聞きたいことある？😊";
        } else {
          try {
            // Gemini APIに送信するプロンプト
            const prompt = `${SYSTEM_PROMPT}\n\nユーザー: ${message}\nhappychan:`;

            // Gemini APIを呼び出し
            const result = await model.generateContent(prompt);
            const response = await result.response;
            aiResponse = response.text();
          } catch (error) {
            console.error('Gemini API error:', error);
            aiResponse = "すみません、ちょっと調子悪いみたいです😅 もう一度試してもらえますか？";
          }
        }

        console.log(`AI応答: ${aiResponse}`);

        // Post message back to Slack
        const fetch = require('node-fetch');
        const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: event.channel,
            text: aiResponse,
            thread_ts: event.ts
          })
        });

        const slackResult = await slackResponse.json();
        console.log('Slack response:', slackResult);
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};