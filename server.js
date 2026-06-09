const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins (your frontend can call this)
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Health check
app.get('/', (req, res) => res.json({ status: 'BlouseAI server running ✅' }));

// ── ANALYSE SAREE IMAGE ──
app.post('/analyse', async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Analyse this saree image carefully. Return ONLY a JSON object, no markdown, no extra text: {"fabric":"e.g. Silk/Cotton/Chiffon/Kanjivaram","primaryColor":"main colour name","secondaryColors":["colour1","colour2"],"pattern":"e.g. Floral/Geometric/Zari/Plain","borderStyle":"border/pallu description","occasion":"e.g. Wedding/Casual/Festive","weaveType":"e.g. Handwoven/Printed","embellishments":"e.g. Zari/Sequins/None"}'
          }
        ]
      }]
    });

    let info;
    try {
      info = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim());
    } catch {
      info = {
        fabric: 'Silk', primaryColor: 'Silver', secondaryColors: ['White'],
        pattern: 'Plain', borderStyle: 'Simple border', occasion: 'Festive',
        weaveType: 'Handwoven', embellishments: 'None'
      };
    }
    res.json({ success: true, analysis: info });

  } catch (err) {
    console.error('Analyse error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GENERATE BLOUSE DESIGNS ──
app.post('/generate', async (req, res) => {
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
    try {
      designs = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim());
    } catch {
      designs = null;
    }
    res.json({ success: true, designs });

  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`BlouseAI server running on port ${PORT}`));
