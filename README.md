# Legal AI SaaS Platform

A modern, full-stack SaaS platform for legal document analysis, chat-based legal assistance, and document generation, powered by Google Gemini AI and MongoDB.

## Features
- **User Authentication**: OTP (email) and Google OAuth login.
- **Chatbot**: AI-powered legal assistant with persistent chat memory per user.
- **Document Analysis**: Upload contracts for instant AI-powered summaries and risk detection.
- **Legal Guides**: Step-by-step legal process guides for India.
- **PDF Generation**: Download consultation summaries as PDFs.
- **Profile Page**: View user details.
- **Responsive UI**: Custom, modern SaaS design with Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Passport.js
- **AI**: Google Gemini (Generative AI)
- **PDF**: pdfkit

---

# API Documentation

## Authentication
### POST `/api/auth/send-otp`
Send OTP to user email.
- **Body:** `{ email: string }`
- **Response:** `{ message: string }`

### POST `/api/auth/verify-otp`
Verify OTP and get JWT token.
- **Body:** `{ email: string, otp: string }`
- **Response:** `{ token: string, user: { email, name } }`

### GET `/api/auth/me`
Get current user info (JWT required).
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ user: { ... } }`

### GET `/api/auth/google`
Start Google OAuth login.

---

## Chatbot & Legal AI
All endpoints below require authentication (JWT in cookie or Authorization header).

### POST `/api/legal/initialize`
Start a new chat session with initial answers.
- **Body:** `{ answers: { 1: string, 2: string, 3: string } }`
- **Response:** `{ message: string, followUpQuestions: [ { question: string } ] }`

### POST `/api/legal/ask`
Send a user message to the chatbot. Gemini AI will use all previous chat context.
- **Body:** `{ message: string, history?: [ { role: 'user'|'assistant', content: string } ] }`
- **Response:** `{ message: string }`

### GET `/api/legal/history`
Get all previous chat messages for the logged-in user.
- **Response:** `{ messages: [ { role, content, timestamp } ] }`

### POST `/api/legal/clear`
Clear all chat history for the logged-in user.
- **Response:** `{ success: true }`

---

## Legal Guides
### POST `/api/guide/guide`
Get a step-by-step legal process guide for India.
- **Body:** `{ processName: string }`
- **Response:** `{ guide: string }`

---

## Document Generation
### POST `/api/document/generate`
Generate a PDF summary of a legal consultation.
- **Body:** `{ conversation: [ { type, content } ], answers: { ... } }`
- **Response:** `{ pdfUrl: string }`

---

## Setup & Development
1. **Install dependencies:**
   - In `/client` and `/server`: `npm install`
2. **Configure environment:**
   - Create `.env` files in both `/client` and `/server` with required keys (see `.env.example` if present).
3. **Run MongoDB** (local or Atlas).
4. **Start servers:**
   - `/server`: `npm start`
   - `/client`: `npm run dev`
5. **Visit**: [http://localhost:3000](http://localhost:3000)

---

## License
MIT
