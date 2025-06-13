<p align="center">
  <img src="client/public/cyfuture.png" alt="Cyfuture Logo" width="180"/>
</p>


# Legal AI Contract Intelligence Platform

**Project developed for the Cyfuture AI Hackathon**

---

## 🚀 Overview
Legal documents are notoriously lengthy, dense, and rich in specialized jargon, making comprehension a significant challenge. Our platform integrates a robust AI stack combining Gemini, LangChain, and DuckDuckGo to deliver end-to-end legal intelligence.

---

## 🏆 Key Features
- **🔐 Login & Access:** Secure Google/OTP authentication.
- **📄 Contract Upload:** Upload contracts (PDF/images) for instant analysis.
- **📊 Analysis & Red Flag Detection:** OCR (Tesseract/Azure Vision) extracts text; LangChain + Gemini identify clauses and compliance issues.
- **💬 Contract Chat Interface:** Chat with your document using Gemini-powered semantic chat (RAG), with contextual Q&A and clause referencing.
- **🔍 Similar Contract Search:** DuckDuckGo scraping retrieves similar contracts; Gemini ranks them by similarity and success probability.
- **📥 PDF Export:** Export chat transcripts and insights as polished PDFs for compliance, audit, and collaboration.
- **🧠 Gemini Prompted Chatbot:** Domain-aware Gemini chatbot for general legal queries.
- **Contextual Contract Benchmarking:** One-click search for similar contracts or past agreements for negotiation insights.
- **Semantic Document Chat:** RAG-powered Q&A with full context—no keyword guessing.
- **Downloadable Knowledge Artifacts:** Export conversations with embedded context as polished PDFs.

---

## 🧑‍💻 Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB, Passport.js
- **AI:** Google Gemini, LangChain, DuckDuckGo
- **OCR:** Tesseract, PyMuPDF, Python integration
- **PDF:** pdfkit

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```powershell
git clone <repo-url>
cd legal_ai
```

### 2. Install dependencies
#### Frontend
```powershell
cd client
npm install
```
#### Backend (Node.js)
```powershell
cd ../server
npm install
```
#### Backend (Python OCR)
```powershell
pip install -r requirements.txt
```

### 3. Install Tesseract OCR
- **Windows:** Download from [here](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH.
- **macOS:** `brew install tesseract`
- **Linux:** `sudo apt-get install tesseract-ocr`

### 4. Environment Variables
- Copy `.env.example` to `.env` in both `client` and `server` folders and fill in required keys (Google, Cloudinary, MongoDB, Gemini, etc).

### 5. Start the servers
```powershell
# In /server
npm start
# In /client
npm run dev
```

---

## 📖 API Documentation (Backend)

### Authentication
- `POST /api/auth/send-otp` — Send OTP to email
- `POST /api/auth/verify-otp` — Verify OTP, get JWT
- `GET /api/auth/me` — Get user info (JWT required)
- `GET /api/auth/google` — Google OAuth login

### OCR & Document Upload
- `POST /api/ocr/upload-single` — Upload and OCR a single file
- `POST /api/ocr/upload-multiple` — Upload and OCR multiple files
- `GET /api/ocr/result/:fileId` — Get OCR result by fileId
- `GET /api/ocr/chunks/:fileId?page=1&limit=10` — Paginated text chunks
- `GET /api/ocr/history` — User's OCR upload history

### Legal Analysis
- `POST /api/legal/analyze/:fileId` — Analyze contract for legal structure, risks, compliance, red flags
- `POST /api/legal/summary/:fileId` — Executive summary
- `POST /api/legal/entities/:fileId` — Extract key entities/terms

### Chatbot
- `POST /api/legal/initialize` — Start chat session
- `POST /api/legal/ask` — Chat with legal AI (contextual)
- `GET /api/legal/history` — Get chat history
- `POST /api/legal/clear` — Clear chat history

### Web Search & Benchmarking
- `POST /api/websearch/search-contracts` — Find and rank similar contracts using DuckDuckGo + Gemini

### PDF Generation
- `POST /api/document/generate` — Generate PDF summary of consultation

---

## 🧩 Python OCR Service
- **Script:** `server/ocr.py`
- **Install dependencies:**
  ```powershell
  pip install -r requirements.txt
  ```
- **Run as part of backend Node.js service (auto-invoked)**
- **Libraries:**
  - `pytesseract`, `Pillow`, `PyMuPDF`, `langchain-text-splitters`, `langchain-core`

---

## 🎯 Target Customers
- Legal teams & law firms (NDAs, vendor agreements, M&A)
- In-house corporate counsel (compliance, onboarding)

## 📈 Market Insights
- 2024: US $31.6 B → 2032: US $63.6 B (CAGR 9.4%)
- North America ~50% share; APAC fastest-growing
- Legal AI/Contract AI: strong VC interest (Harvey, Ivo, etc)

## 📣 Marketing & Outreach
- Webinars, demos, case studies, legal tech conferences
- Freemium model: limited analysis, premium for PDF/benchmarking

---

## 🤝 Acknowledgements
- Built for the **Cyfuture AI Hackathon**
- Powered by Google Gemini, LangChain, DuckDuckGo, Tesseract, PyMuPDF

---

<p align="center">
  <img src="client/public/cyfuture.png" alt="Cyfuture Logo" width="120"/>
</p>
