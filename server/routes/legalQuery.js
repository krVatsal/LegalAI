// routes/legalQuery.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
console.log("API KEY:",process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize chat with user's initial answers
router.post('/initialize', async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Based on the following initial answers from a user seeking legal assistance, provide a welcoming message and ask a relevant follow-up question:
    Type of legal assistance: ${answers[1]}
    Case status: ${answers[2]}
    Preferred language: ${answers[3]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      followUpQuestions: [
        {
          question: "Would you like to provide more details about your situation?"
        }
      ]
    });
  } catch (error) {
    console.error('Error in initialize:', error);
    res.status(500).json({ 
      error: 'Failed to initialize chat',
      details: error.message 
    });
  }
});

// Handle user queries with context
router.post('/ask', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `As a legal assistant, provide a helpful response to the following query, considering the user's context:
    Context:
    - Type of legal assistance: ${context[1]}
    - Case status: ${context[2]}
    - Preferred language: ${context[3]}
    
    User Query: ${query}
    
    Provide a clear, concise response and suggest 2-3 relevant follow-up questions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract follow-up questions from the response
    const followUpQuestions = [
      {
        question: "Would you like to know more about the legal process involved?"
      },
      {
        question: "Do you have any specific deadlines or time constraints?"
      }
    ];

    res.json({
      answer: text,
      followUpQuestions
    });
  } catch (error) {
    console.error('Error in ask:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error.message 
    });
  }
});

export default router;
