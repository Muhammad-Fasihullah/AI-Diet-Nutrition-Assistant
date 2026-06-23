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
-- TABLE 3: user_memory  (persistent long-term memory)
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
-- TABLE 5: recipes  (static recipe database — AI only ranks)
-- =============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,   -- array of ingredient names
  calories    INTEGER,
  protein     DECIMAL(5,2),
  carbs       DECIMAL(5,2),
  fats        DECIMAL(5,2),
  prep_time   INTEGER,           -- minutes
  difficulty  TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  steps       TEXT[],            -- array of step strings
  tags        TEXT[]             -- e.g. ['high-protein', 'vegetarian', 'quick']
);

-- =============================================================
-- TABLE 6: recipe_requests  (user recipe generation history)
-- =============================================================
CREATE TABLE IF NOT EXISTS recipe_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  detected_ingredients  TEXT[],
  matched_recipes       JSONB,
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
-- recipes table is public (no RLS needed)

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
-- SEED DATA: Sample recipes for recipe generator
-- =============================================================
INSERT INTO recipes (name, description, ingredients, calories, protein, carbs, fats, prep_time, difficulty, steps, tags) VALUES

('Grilled Chicken Salad',
 'High-protein, low-calorie meal perfect for weight loss.',
 ARRAY['chicken breast', 'lettuce', 'tomato', 'cucumber', 'olive oil', 'lemon'],
 350, 45.0, 12.0, 8.0, 20, 'easy',
 ARRAY['Season chicken breast with salt, pepper, and herbs', 'Grill chicken for 6-8 minutes each side', 'Chop lettuce, tomato, and cucumber', 'Slice grilled chicken and place over vegetables', 'Drizzle with olive oil and lemon juice'],
 ARRAY['high-protein', 'low-calorie', 'weight-loss', 'gluten-free']),

('Chicken Stir Fry',
 'Quick and nutritious stir fry packed with vegetables.',
 ARRAY['chicken breast', 'bell pepper', 'broccoli', 'onion', 'soy sauce', 'garlic', 'ginger'],
 420, 38.0, 28.0, 10.0, 25, 'easy',
 ARRAY['Cut chicken into bite-sized pieces', 'Heat oil in a wok or large pan over high heat', 'Cook chicken until golden, set aside', 'Stir-fry vegetables with garlic and ginger for 3-4 minutes', 'Return chicken, add soy sauce, toss and serve'],
 ARRAY['high-protein', 'quick', 'vegetables']),

('Vegetable Omelette',
 'Protein-rich breakfast with fresh vegetables.',
 ARRAY['eggs', 'bell pepper', 'onion', 'tomato', 'spinach', 'cheese'],
 280, 22.0, 8.0, 18.0, 10, 'easy',
 ARRAY['Whisk 3 eggs with salt and pepper', 'Chop all vegetables finely', 'Cook vegetables in pan until soft', 'Pour egg mixture over vegetables', 'Fold omelette and cook until set'],
 ARRAY['breakfast', 'high-protein', 'vegetarian', 'quick']),

('Lentil Soup',
 'Hearty and filling high-fiber soup for weight management.',
 ARRAY['lentils', 'tomato', 'onion', 'garlic', 'cumin', 'coriander', 'spinach'],
 320, 18.0, 48.0, 4.0, 35, 'easy',
 ARRAY['Rinse lentils thoroughly', 'Saute onion and garlic until golden', 'Add spices and cook for 1 minute', 'Add lentils and tomatoes with 4 cups water', 'Simmer for 25 minutes, add spinach at end'],
 ARRAY['high-fiber', 'vegetarian', 'weight-loss', 'budget-friendly']),

('Grilled Salmon with Vegetables',
 'Omega-3 rich meal with roasted vegetables.',
 ARRAY['salmon', 'zucchini', 'bell pepper', 'cherry tomatoes', 'olive oil', 'garlic', 'lemon'],
 480, 42.0, 18.0, 22.0, 30, 'medium',
 ARRAY['Preheat oven to 200°C', 'Season salmon with olive oil, garlic, lemon', 'Chop vegetables and toss with olive oil', 'Place salmon and vegetables on baking tray', 'Bake for 20-25 minutes until salmon flakes easily'],
 ARRAY['high-protein', 'omega-3', 'gluten-free', 'heart-healthy']),

('Chicken Biryani (Light)',
 'Lighter version of classic biryani with reduced oil.',
 ARRAY['chicken', 'basmati rice', 'onion', 'tomato', 'yogurt', 'biryani spices', 'mint'],
 580, 35.0, 72.0, 12.0, 50, 'medium',
 ARRAY['Marinate chicken in yogurt and spices for 30 mins', 'Cook rice until 70% done, drain', 'Brown onions until crispy', 'Layer chicken and rice, add mint and saffron water', 'Cook on low heat (dum) for 20 minutes'],
 ARRAY['Pakistani', 'high-protein', 'special-occasion']),

('Overnight Oats',
 'Fiber-rich breakfast requiring zero morning prep.',
 ARRAY['oats', 'milk', 'banana', 'honey', 'chia seeds', 'berries'],
 380, 12.0, 65.0, 8.0, 5, 'easy',
 ARRAY['Add oats to a jar or bowl', 'Pour milk over oats (equal ratio)', 'Add chia seeds and honey, mix well', 'Top with sliced banana and berries', 'Cover and refrigerate overnight'],
 ARRAY['breakfast', 'high-fiber', 'meal-prep', 'vegetarian', 'quick']),

('Tuna Salad Wrap',
 'High-protein quick lunch wrap.',
 ARRAY['tuna', 'lettuce', 'tomato', 'cucumber', 'whole wheat tortilla', 'Greek yogurt', 'lemon'],
 380, 35.0, 32.0, 8.0, 10, 'easy',
 ARRAY['Drain tuna and mix with Greek yogurt and lemon', 'Lay tortilla flat', 'Add lettuce, tomato, cucumber', 'Add tuna mixture', 'Roll tightly and slice in half'],
 ARRAY['high-protein', 'quick', 'lunch', 'weight-loss']);

-- =============================================================
-- VERIFY
-- =============================================================
SELECT 'Schema created successfully' AS status;
SELECT COUNT(*) AS recipe_count FROM recipes;
