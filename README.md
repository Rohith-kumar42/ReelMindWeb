# 🎥 ReelMind

ReelMind is an AI-powered personal learning library designed to help you save, organize, and discover insights from Instagram Reels and tech resources. It automatically scrapes metadata, generates semantic embeddings for vector search, and classifies content using advanced AI models.

## 🚀 Live Demo
[https://reel-mind-web-29z8-xi.vercel.app/](https://reel-mind-web-29z8-xi.vercel.app/)

## ✨ Key Features
- **Automated Content Pipeline**: Simply provide an Instagram Reel URL and an optional resource link. ReelMind handles the scraping, summarization, and categorization.
- **Semantic Vector Search**: Find your saved resources using natural language queries (e.g., "AI video tools" or "design inspiration") powered by `pgvector`.
- **AI Classification**: Automatically assigns categories, tags, and content types (Tool, Course, Repo, etc.) with confidence scores.
- **Dynamic Organization**: Content is grouped into visually distinct categories with custom colors and icons.
- **Duplicate Detection**: Prevents saving the same resource twice using vector similarity checks.
- **Modern UI**: A sleek, responsive frontend built with React and Vite.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Vanilla CSS with modern aesthetics.
- **Backend**: Node.js Serverless Functions (Vercel).
- **Database**: Supabase (PostgreSQL + pgvector).
- **AI/ML**: 
  - **LLM**: Meta Llama 3.1 (via Nvidia/OpenAI compatible API) for classification.
  - **Embeddings**: Nvidia NV-EmbedQA (via Nvidia/OpenAI compatible API) for semantic search.
- **Scraping**: Custom scrapers for Instagram and general web links.

## 📁 Project Structure
```
├── api/                # Vercel Serverless Functions (Node.js)
│   ├── _lib/           # Shared logic, AI pipeline, and database client
│   ├── content.js      # CRUD operations for content items
│   ├── search.js       # Semantic search and suggestions
│   └── ...             # Other API endpoints (tags, categories, etc.)
├── frontend/           # React + Vite application
├── database/           # SQL schema and seed data
└── vercel.json         # Vercel configuration for functions and rewrites
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Supabase account
- OpenAI or Nvidia API key (for AI features)

### 1. Clone the repository
```bash
git clone https://github.com/Rohith-kumar42/ReelMindWeb.git
cd ReelMindWeb
```

### 2. Database Setup
1. Create a new project in [Supabase](https://supabase.com/).
2. Run the SQL provided in `database/schema.sql` in the Supabase SQL Editor to set up tables and the vector search function.
3. (Optional) Run `database/seed.sql` to populate initial data.

### 3. Environment Variables
Create a `.env` file in the root with the following:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_api_key

# App
FRONTEND_URL=http://localhost:5173
```

### 4. Local Development
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**API (Local Testing):**
The `api/` folder includes a lightweight development server for testing serverless functions locally:
```bash
cd api
# Ensure dependencies are installed
npm install
node _dev-server.js
```

## 🚢 Deployment
The project is configured for seamless deployment on **Vercel**. 
The `vercel.json` file automatically handles build commands, output directories, and API rewrites.

---
Built with ❤️ for lifelong learners.
