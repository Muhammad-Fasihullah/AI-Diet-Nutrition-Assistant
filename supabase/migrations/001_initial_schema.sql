-- =============================================================
-- AI Diet & Nutrition Assistant — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABLE 1: profiles
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  age             INTEGER NOT NULL CHECK (age > 0 AND age < 120),
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  weight          DECIMAL(5,2) NOT NULL CHECK (weight > 0),   -- kg
  height          DECIMAL(5,2) NOT NULL CHECK (height > 0),   -- cm
  bmi             DECIMAL(4,1),
  bmi_category    TEXT,
  activity_level  TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active')),
  goal            TEXT NOT NULL CHECK (goal IN ('weight_loss', 'weight_gain', 'maintain')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE 2: chat_history  (role-based for memory system)
-- =============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- =============================================================
-- TABLE 3: user_memory  (persistent long-term memory per user)
-- =============================================================
CREATE TABLE IF NOT EXISTS user_memory (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_summary  TEXT DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- TABLE 4: image_analysis  (food image analysis results)
-- =============================================================
CREATE TABLE IF NOT EXISTS image_analysis (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url       TEXT,
  detected_food   TEXT,
  analysis_result JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_analysis_user_id ON image_analysis(user_id);

-- =============================================================
-- TABLE 5: recipe_requests  (AI-generated recipe history)
-- =============================================================
CREATE TABLE IF NOT EXISTS recipe_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  detected_ingredients  TEXT[],
  final_output          JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_requests_user_id ON recipe_requests(user_id);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analysis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/modify their own
CREATE POLICY "profiles_own" ON profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat history: own data only
CREATE POLICY "chat_own" ON chat_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User memory: own only
CREATE POLICY "memory_own" ON user_memory
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Image analysis: own only
CREATE POLICY "analysis_own" ON image_analysis
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recipe requests: own only
CREATE POLICY "recipe_req_own" ON recipe_requests
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- VERIFY
-- =============================================================
SELECT 'Schema created successfully' AS status;
