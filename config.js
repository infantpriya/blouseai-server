export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only return the publishable key (rzp_live or rzp_test) — safe to expose to frontend
  res.status(200).json({
    key: process.env.RAZORPAY_KEY_ID || ''
  });
}
