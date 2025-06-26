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
        
        // For now, just acknowledge the event
        // We'll add AI response later once this works
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};