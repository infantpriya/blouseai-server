const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: 'Analyse this saree image carefully. Return ONLY a JSON object, no markdown, no extra text: {"fabric":"e.g. Silk/Cotton/Chiffon/Kanjivaram","primaryColor":"main colour name","secondaryColors":["colour1","colour2"],"pattern":"e.g. Floral/Geometric/Zari/Plain","borderStyle":"border/pallu description","occasion":"e.g. Wedding/Casual/Festive","weaveType":"e.g. Handwoven/Printed","embellishments":"e.g. Zari/Sequins/None"}' }
        ]
      }]
    });

    let info;
    try { info = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim()); }
    catch { info = { fabric: 'Silk', primaryColor: 'Silver', secondaryColors: ['White'], pattern: 'Plain', borderStyle: 'Simple border', occasion: 'Festive', weaveType: 'Handwoven', embellishments: 'None' }; }

    res.status(200).json({ success: true, analysis: info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
