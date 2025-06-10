// routes/legalQuery.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import ChatMessage from '../models/ChatMessage.js';
dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get previous chats for a user
router.get('/history', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ messages: [] });
    }
    const userId = req.user._id;
    const chat = await ChatMessage.findOne({ userId });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Clear chat history for a user
router.post('/clear', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true });
    }
    const userId = req.user._id;
    await ChatMessage.deleteOne({ userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// Initialize chat with user's initial answers
router.post('/initialize', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Based on the following initial answers from a user seeking legal assistance, provide a welcoming message and ask a relevant follow-up question:\nType of legal assistance: ${answers[1]}\nCase status: ${answers[2]}\nPreferred language: ${answers[3]}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Store the first assistant message only if user is authenticated
    if (req.user) {
      const userId = req.user._id;      await ChatMessage.findOneAndUpdate(
        { userId },
        { $set: { messages: [{ role: 'assistant', content: text }] } },
        { upsert: true }
      );
    }
    
    res.json({
      message: text,
      followUpQuestions: [
        { question: "Would you like to provide more details about your situation?" }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize chat', details: error.message });
  }
});

// Handle user queries with context
router.post('/ask', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get userId if authenticated, otherwise use a temporary/guest session
    const userId = req.user?._id || 'guest';
    
    // Get previous chat only if user is authenticated
    let chat = null;
    if (req.user) {
      chat = await ChatMessage.findOne({ userId });
      if (!chat) {
        chat = await ChatMessage.create({ userId, messages: [] });
      }
      // Add user message
      chat.messages.push({ role: 'user', content: message });
    }
    
    // Prepare context for AI: use provided history if sent, else use DB (if authenticated)
    let contextMessages = history && Array.isArray(history) && history.length > 0
      ? history
      : (chat ? chat.messages : []);
    
    const context = contextMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // --- Custom prompt for Indian legal chatbot, markdown, bold headings, points ---
    const prompt = `You are a professional legal assistant specializing in Indian law.\n\nBased on the following conversation, answer the user's latest question in clear, concise, and legally accurate language.\n\n- Always answer as per Indian law, regardless of the topic (e.g., divorce, public decency, criminal law, etc.).\n- Use bold headings (with **, e.g., **Heading:**) for each section.\n- Present all steps, requirements, or lists as bullet points or numbered points, each on a new line.\n- Remove any unnecessary markdown or asterisks except for headings.\n- Do not include any generic chatbot instructions or example prompts.\n- Always end with: _Note: This is not legal advice. Please consult a qualified advocate in your jurisdiction for specific guidance._\n\nConversation:\n${context}\n\nAssistant:`;    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Add assistant message and save only if user is authenticated
    if (chat && req.user) {
      chat.messages.push({ role: 'assistant', content: text });
      await chat.save();
    }
    
    res.json({ message: text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

export default router;
