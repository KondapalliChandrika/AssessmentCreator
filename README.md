#  VedaAI — AI-Powered Assessment Creator

Assessment Creator is a full-stack web application that helps teachers create, manage, and distribute AI-generated question papers and assignments with ease.

---

##  Features

- 📄 **AI Question Paper Generation** — Automatically generate question papers using Google Gemini
- 🖼️ **Image-to-Assignment** — Upload a textbook image and let AI detect the subject, grade, and topic
- 📋 **Answer Key** — AI-generated answers included in every paper 
- 📊 **Real-time Progress** — Live generation status via WebSocket
- 📥 **PDF Export** — Download fully formatted question papers as PDFs
- 🗂️ **Assignment Management** — Create, view, delete, and regenerate assignments
- 🔁 **Background Jobs** — Assignment generation runs in a BullMQ queue (non-blocking)
- ⚡ **Redis Caching** — Fast assignment & paper lookups

---

##  Tech Stack

### Languages
- **TypeScript** (frontend + backend)

### Frontend
| Tech | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework + routing |
| **Tailwind CSS** | Styling |
| **Zustand** | Global state management |
| **React Hook Form + Zod** | Form handling & validation |
| **react-dropzone** | File upload UI |
| **Socket.IO Client** | Real-time generation updates |
| **Heroicons** | Icons |

### Backend
| Tech | Purpose |
|---|---|
| **Express.js** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **BullMQ** | Background job queue |
| **ioredis / Redis** | Caching + BullMQ connection |
| **Socket.IO** | Real-time WebSocket events |
| **Multer** | File upload handling |
| **Puppeteer** | PDF generation |
| **Google Gemini API** | AI question paper & metadata generation |
| **Zod** | Response schema validation |

---

##  Project Structure

```
vedaAI/
├── frontend/                  # Next.js app
│   ├── app/
│   │   └── (dashboard)/
│   │       └── assignments/   # Assignment list, detail, create pages
│   ├── components/            # Reusable UI components
│   ├── store/                 # Zustand store (assignmentStore)
│   ├── hooks/                 # useWebSocket, etc.
│   └── lib/                   # Types, API helpers
│
└── backend/                   # Express API
    └── src/
        ├── routes/            # API route handlers
        ├── models/            # Mongoose models (Assignment, QuestionPaper)
        ├── services/          # aiService, cacheService, pdfService
        ├── queues/            # BullMQ queue setup
        └── workers/           # generationWorker (background job)
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

- **Node.js** v18+
- **MongoDB** (local or cloud — [MongoDB Atlas](https://cloud.mongodb.com))
- **Redis** (local)
  ```bash
  # Install Redis (Ubuntu/Debian)
  sudo apt install redis-server
  # Start Redis
  sudo systemctl start redis
  # Check Redis is running
  redis-cli ping   # Should return: PONG
  ```
- **Google Gemini API Key** — get one at [aistudio.google.com](https://aistudio.google.com)

---

##  Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd vedaAI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

Start the backend dev server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

##  Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Port for Express server (default: 5000) |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `REDIS_URL` | ✅ | Redis connection URL |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS (e.g. `http://localhost:3000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | ✅ | Backend WebSocket URL |

---

##  Available Scripts

### Backend
```bash
npm run dev     # Start dev server with hot reload (ts-node-dev)
npm run build   # Compile TypeScript to JS
npm run start   # Run compiled production build
```

### Frontend
```bash
npm run dev     # Start Next.js dev server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

##  API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assignments` | List all assignments |
| `POST` | `/api/assignments` | Create a new assignment |
| `GET` | `/api/assignments/:id` | Get assignment by ID |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `POST` | `/api/assignments/:id/regenerate` | Regenerate question paper |
| `GET` | `/api/assignments/:id/paper` | Get the question paper |
| `GET` | `/api/assignments/:id/pdf` | Download paper as PDF |

---

##  How AI Generation Works

1. User fills the **Create Assignment** form (upload image + configure question types)
2. Backend receives the request and adds a **BullMQ job** to the queue
3. The **generationWorker** picks up the job and:
   - Sends progress events via **Socket.IO**
   - Calls **Gemini API** to generate the full question paper (with answers)
   - Saves the paper to **MongoDB**
   - Caches it in **Redis**
4. Frontend receives real-time progress and redirects to the paper when done

---

##  Key UI Features

- **Assignments list** — card grid with quiz title, assigned date & due date
- **Create Assignment** — multi-step form with image upload (required), question type table, marks configuration
- **Assignment detail** — full paper view with sections, questions, difficulty tags, and answer key
- **PDF download** — formatted question paper with answer key section
- **Progress modal** — real-time circular progress ring during generation

---

