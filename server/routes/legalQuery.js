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
    const userId = req.user._id;
    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Based on the following initial answers from a user seeking legal assistance, provide a welcoming message and ask a relevant follow-up question:\nType of legal assistance: ${answers[1]}\nCase status: ${answers[2]}\nPreferred language: ${answers[3]}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Store the first assistant message
    await ChatMessage.findOneAndUpdate(
      { userId },
      { $set: { messages: [{ role: 'assistant', content: text }] } },
      { upsert: true }
    );
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
    const userId = req.user._id;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    // Get previous chat
    let chat = await ChatMessage.findOne({ userId });
    if (!chat) {
      chat = await ChatMessage.create({ userId, messages: [] });
    }
    // Add user message
    chat.messages.push({ role: 'user', content: message });
    // Prepare context for AI: use provided history if sent, else use DB
    let contextMessages = history && Array.isArray(history) && history.length > 0
      ? history
      : chat.messages;
    const context = contextMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `${context}\nAssistant:`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Add assistant message
    chat.messages.push({ role: 'assistant', content: text });
    await chat.save();
    res.json({ message: text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

export default router;
