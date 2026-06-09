import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { analysis, style, neckline } = req.body;
    if (!analysis) return res.status(400).json({ error: 'No analysis provided' });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content: `Based on this saree analysis, generate 4 unique blouse design concepts.
Saree: ${JSON.stringify(analysis)}
Style preference: ${style || 'Traditional'}
Neckline preference: ${neckline || 'Any'}

Return ONLY a JSON array (no markdown, no extra text):
[{
  "name": "short design name (3-4 words)",
  "neckline": "neckline type",
  "sleeves": "sleeve description",
  "back": "back design description",
  "embellishment": "embellishment suggestion",
  "colorScheme": "colour recommendation matching the saree",
  "tags": ["tag1","tag2","tag3"],
  "description": "2-sentence description of the blouse",
  "svgShape": "classic or princess or cape or peplum",
  "accentColor": "#hexcolor that matches saree",
  "tailoringSteps": ["step1","step2","step3","step4","step5"]
}]`
      }]
    });

    let designs;
    try { designs = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim()); }
    catch { designs = null; }

    res.status(200).json({ success: true, designs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
