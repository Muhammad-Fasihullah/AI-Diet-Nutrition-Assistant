# AI Diet & Nutrition Assistant

A full-stack AI-powered nutrition assistant built with **Next.js 16**, **Supabase**, and **Groq AI**. Users get personalized diet advice, food image analysis, and recipe generation — all based on their body metrics and health goals.

---

## Features

- **Authentication** — Secure signup & login via Supabase Auth
- **Profile Setup** — 4-step onboarding (personal info, body measurements, lifestyle & goals, review)
- **Dashboard** — Overview of BMI, goals, activity stats, and recent chat history
- **AI Chat** — Conversational nutrition coach with 3-layer persistent memory
- **Food Analysis** — Upload or photograph food → AI identifies items and returns full nutrition breakdown
- **Recipe Generator** — Upload ingredient images → AI detects ingredients and generates 3 personalized ranked recipes
- **Profile Management** — View and edit profile with live BMI calculator

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth + Database | Supabase |
| AI — Chat | Groq (Llama 3.3 70B Versatile) |
| AI — Vision | Groq (Llama 4 Scout 17B) |
| State Management | TanStack React Query v5 |
| Validation | Zod v4 |
| HTTP Client | Axios |

---

## Project Structure

```
ai-diet-app/
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── api/                        # Next.js API Routes (backend)
    │   │   │   ├── profile/                # GET, POST, PUT /api/profile
    │   │   │   ├── chat/                   # POST /api/chat
    │   │   │   ├── chat/history/           # GET, DELETE /api/chat/history
    │   │   │   ├── analyze-food/           # POST /api/analyze-food
    │   │   │   ├── analyze-food/history/   # GET /api/analyze-food/history
    │   │   │   ├── generate-recipe/        # POST /api/generate-recipe
    │   │   │   ├── generate-recipe/history/
    │   │   │   └── dashboard/stats/        # GET /api/dashboard/stats
    │   │   ├── auth/                       # Login & Signup pages
    │   │   ├── dashboard/                  # Dashboard page
    │   │   ├── chat/                       # AI Chat page
    │   │   ├── food-analysis/              # Food Analysis page
    │   │   ├── recipe-generator/           # Recipe Generator page
    │   │   ├── profile/                    # Profile view/edit page
    │   │   └── profile-setup/              # Onboarding (first-time setup)
    │   ├── components/
    │   │   ├── chat/                       # ChatMessage, ChatInput
    │   │   ├── food/                       # FoodUploader, FoodResult
    │   │   ├── recipe/                     # RecipeUploader, RecipeResults
    │   │   ├── layout/                     # Sidebar navigation
    │   │   ├── shared/                     # LoginForm, SignupForm, Providers
    │   │   └── ui/                         # shadcn/ui base components
    │   ├── lib/
    │   │   ├── server/                     # Server-side only (never sent to browser)
    │   │   │   ├── ai.ts                   # Groq AI wrapper (chat + vision)
    │   │   │   ├── memory.ts               # Chat memory management
    │   │   │   ├── auth.ts                 # JWT auth middleware (withAuth)
    │   │   │   ├── supabase-admin.ts       # Supabase admin client
    │   │   │   ├── schemas.ts              # Zod validation schemas
    │   │   │   ├── errors.ts               # Error response helpers
    │   │   │   └── utils.ts                # BMI calculator
    │   │   ├── supabase/
    │   │   │   ├── client.ts               # Browser Supabase client
    │   │   │   └── server.ts               # Server Supabase client
    │   │   ├── api.ts                      # Axios client + typed API functions
    │   │   └── utils.ts                    # Client utilities (BMI, formatting)
    │   ├── middleware.ts                   # Session sync (required for Supabase SSR)
    │   ├── types/index.ts                  # Global TypeScript types
    │   └── styles/globals.css
    └── .env.local                          # Environment variables (create this)
```

---

## Database Setup (Supabase)

Run this SQL in your Supabase project → **SQL Editor**:

```sql
-- User profiles
create table profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text not null,
  age integer not null,
  gender text not null,
  weight numeric not null,
  height numeric not null,
  bmi numeric not null,
  bmi_category text not null,
  activity_level text not null,
  goal text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages
create table chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Long-term AI memory per user
create table user_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  memory_summary text,
  updated_at timestamptz default now()
);

-- Food image analyses
create table image_analysis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text,
  detected_food text,
  analysis_result jsonb,
  created_at timestamptz default now()
);

-- Recipe generation requests
create table recipe_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  detected_ingredients jsonb,
  final_output jsonb,
  created_at timestamptz default now()
);
```

> **Tip:** In Supabase Dashboard → Authentication → Settings → disable **"Confirm email"** for local development so you can sign up without email verification.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key (free)

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Create environment file

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual keys:

```env
# Supabase — Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Groq AI — console.groq.com/keys (free)
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — **server-side only, never expose** |
| `GROQ_API_KEY` | ✅ | Groq API key |
| `GROQ_MODEL` | ✅ | Text LLM model ID |
| `GROQ_VISION_MODEL` | ✅ | Vision LLM model ID |

---

## API Reference

All endpoints require `Authorization: Bearer <supabase_jwt>` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/profile` | Create user profile |
| `GET` | `/api/profile` | Get user profile |
| `PUT` | `/api/profile` | Update user profile |
| `POST` | `/api/chat` | Send message, get AI reply |
| `GET` | `/api/chat/history` | Get full chat history |
| `DELETE` | `/api/chat/history` | Clear chat + AI memory |
| `POST` | `/api/analyze-food` | Analyze food image (multipart) |
| `GET` | `/api/analyze-food/history` | Get past food analyses |
| `POST` | `/api/generate-recipe` | Generate recipes from images (multipart) |
| `GET` | `/api/generate-recipe/history` | Get past recipe generations |
| `GET` | `/api/dashboard/stats` | Get dashboard statistics |

---

## How It Works

### AI Chat Memory System

Three layers work together to make the AI feel personalized:

| Layer | Source | Used for |
|---|---|---|
| Profile context | `profiles` table | Always in system prompt |
| Short-term memory | Last 10 `chat_history` rows | Recent conversation continuity |
| Long-term memory | `user_memory` summary | Food preferences, patterns (updated every 10 messages) |

### Food Analysis Flow

1. User uploads or photographs food
2. Image encoded to base64 and sent to Groq vision model
3. AI returns JSON: detected foods, calories, protein, carbs, fat, goal assessment, alternatives
4. Result saved to `image_analysis` table and displayed

### Recipe Generation Flow

1. User uploads 1–5 ingredient images
2. Vision AI detects all ingredients from images
3. Text AI generates 3 ranked recipes (Best Match, Alternative, Quick Option)
4. Each recipe is personalized to the user's BMI, goal, and activity level

---

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the browser — server-side only
- All API routes validate JWT tokens via Supabase Admin (`supabase.auth.getUser(token)`)
- Never commit `.env.local` to git

---

## Build for Production

```bash
npm run build
npm start
```

---

## License

MIT
