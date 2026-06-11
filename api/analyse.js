module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 600,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: 'data:' + (mediaType || 'image/jpeg') + ';base64,' + imageBase64 } },
            { type: 'text', text: 'Analyse this saree image carefully. Return ONLY a JSON object, no markdown, no extra text: {"fabric":"e.g. Silk/Cotton/Chiffon/Kanjivaram","primaryColor":"main colour name","secondaryColors":["colour1","colour2"],"pattern":"e.g. Floral/Geometric/Zari/Plain","borderStyle":"border/pallu description","occasion":"e.g. Wedding/Casual/Festive","weaveType":"e.g. Handwoven/Printed","embellishments":"e.g. Zari/Sequins/None"}' }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq error ' + response.status);
    }

    const data = await response.json();
    let info;
    try { info = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, '').trim()); }
    catch { info = { fabric: 'Silk', primaryColor: 'Silver', secondaryColors: ['White'], pattern: 'Plain', borderStyle: 'Simple border', occasion: 'Festive', weaveType: 'Handwoven', embellishments: 'None' }; }

    res.status(200).json({ success: true, analysis: info });
  } catch (err) {
    console.error('Analyse error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
