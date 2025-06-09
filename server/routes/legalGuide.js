
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/guide', async (req, res) => {
  try {
    const { processName } = req.body;

    const prompt = `
You are a legal assistant. Explain the process of "${processName}" in India as a step-by-step guide for a beginner.
Use clear formatting and simple terms.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const guide = response.text();

    res.json({ guide });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch legal process guide' });
  }
});

export default router;
