
import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/guide', async (req, res) => {
  try {
    const { processName } = req.body;

    const prompt = `
You are a legal assistant. Explain the process of "${processName}" in India as a step-by-step guide for a beginner.
Use clear formatting and simple terms.
`;

    const result = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const guide = result.choices[0]?.message?.content || "";

    res.json({ guide });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch legal process guide' });
  }
});

export default router;
