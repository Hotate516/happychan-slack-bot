// シンプルなSlack API endpoint
module.exports = async (req, res) => {
  console.log('Request received:', req.method, req.body);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Slack API endpoint is running' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Parsed body:', body);

    // URL verification challenge
    if (body && body.type === 'url_verification') {
      console.log('URL verification challenge:', body.challenge);
      return res.status(200).json({ challenge: body.challenge });
    }

    // Event handling
    if (body && body.type === 'event_callback') {
      const event = body.event;
      console.log('Event received:', event);
      
      // Ignore bot messages
      if (event.bot_id || event.subtype) {
        return res.status(200).json({ ok: true });
      }

      // Handle app mentions
      if (event.type === 'app_mention') {
        console.log('App mention detected');
        
        // メッセージからメンション部分を除去
        const message = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
        console.log('Message:', message);

        // Gemini APIで返答生成
        let aiResponse;
        try {
          console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
          console.log('GEMINI_API_KEY starts with AIza:', process.env.GEMINI_API_KEY?.startsWith('AIza'));
          
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          if (!message) {
            aiResponse = "はーい！何か聞きたいことある？😊";
          } else {
            // シンプルなテスト
            const result = await model.generateContent("こんにちはと日本語で返答して");
            const response = await result.response;
            aiResponse = response.text();
          }
          
          console.log('Gemini response success:', aiResponse);
        } catch (error) {
          console.error('Gemini API error details:', error.message, error.stack);
          aiResponse = `すみません、エラーです😅 (${error.message})`;
        }

        // Slackに返答投稿
        try {
          const fetch = require('node-fetch');
          const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel: event.channel,
              text: aiResponse
            })
          });

          const slackResult = await slackResponse.json();
          console.log('Slack response:', slackResult);
        } catch (error) {
          console.error('Slack API error:', error);
        }
        
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};