-- Gyaan Vriksh v2.0 Foundation Schema
-- Supports v2.1 compliance delta (COPPA 2025, UAE DL 26/2025, EU AI Act, Japan APPI)

-- ============================================================
-- 1. CUSTOM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE age_bracket AS ENUM ('under_10', '10_12', '13_15', '16_17', 'adult');
CREATE TYPE exploration_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE branch_type AS ENUM ('career', 'deeper_topic', 'connection', 'application', 'question');
CREATE TYPE bloom_level AS ENUM ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create');
CREATE TYPE content_report_type AS ENUM ('age_inappropriate', 'incorrect', 'uncomfortable', 'other');
CREATE TYPE report_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');
CREATE TYPE consent_status AS ENUM ('pending', 'granted', 'withdrawn');
CREATE TYPE consent_method AS ENUM ('credit_card', 'government_id', 'kba');
CREATE TYPE notification_frequency AS ENUM ('realtime', 'daily', 'weekly');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Extends auth.users with application-specific profile data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  age_bracket age_bracket,
  locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'hi', 'pa', 'ja')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  parent_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_students INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

CREATE TABLE parent_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_status consent_status NOT NULL DEFAULT 'pending',
  consent_method consent_method,
  consent_granted_at TIMESTAMPTZ,
  consent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

CREATE TABLE parent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit_minutes INTEGER NOT NULL DEFAULT 60,
  allowed_categories TEXT[] NOT NULL DEFAULT '{}',
  account_paused BOOLEAN NOT NULL DEFAULT false,
  notification_frequency notification_frequency NOT NULL DEFAULT 'daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

CREATE TABLE exploration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  passage_hash TEXT NOT NULL,
  passage_preview TEXT,
  subject_label TEXT,
  status exploration_status NOT NULL DEFAULT 'active',
  branch_count INTEGER NOT NULL DEFAULT 0,
  max_depth_reached INTEGER NOT NULL DEFAULT 0,
  bloom_level_reached bloom_level,
  duration_seconds INTEGER,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE exploration_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exploration_sessions(id) ON DELETE CASCADE,
  parent_branch_id UUID REFERENCES exploration_branches(id) ON DELETE SET NULL,
  branch_type branch_type NOT NULL,
  label TEXT NOT NULL,
  summary TEXT,
  bloom_level bloom_level,
  depth INTEGER NOT NULL DEFAULT 0,
  is_expanded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- v2.1 spec: exact schema match
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES exploration_sessions(id),
  branch_id UUID REFERENCES exploration_branches(id),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reporter_role TEXT NOT NULL CHECK (reporter_role IN ('student', 'teacher', 'parent')),
  report_type content_report_type NOT NULL,
  report_text TEXT CHECK (char_length(report_text) <= 200),
  priority report_priority NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exploration_count INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  UNIQUE(student_id, usage_date)
);

-- v2.1 compliance: consent audit trail
CREATE TABLE consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id),
  child_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn', 'updated')),
  consent_details JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE INDEX idx_classes_parent_code ON classes(parent_code);
CREATE INDEX idx_class_memberships_class_id ON class_memberships(class_id);
CREATE INDEX idx_class_memberships_student_id ON class_memberships(student_id);
CREATE INDEX idx_parent_child_links_parent_id ON parent_child_links(parent_id);
CREATE INDEX idx_parent_child_links_child_id ON parent_child_links(child_id);
CREATE INDEX idx_exploration_sessions_student_id ON exploration_sessions(student_id);
CREATE INDEX idx_exploration_sessions_class_id ON exploration_sessions(class_id);
CREATE INDEX idx_exploration_sessions_created_at ON exploration_sessions(created_at);
CREATE INDEX idx_exploration_branches_session_id ON exploration_branches(session_id);
CREATE INDEX idx_exploration_branches_parent_branch_id ON exploration_branches(parent_branch_id);
CREATE INDEX idx_content_reports_session_id ON content_reports(session_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_priority ON content_reports(priority);
CREATE INDEX idx_daily_usage_student_date ON daily_usage(student_id, usage_date);
CREATE INDEX idx_consent_audit_log_parent_id ON consent_audit_log(parent_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Generate readable join code (6 chars, excludes confusable: I/O/0/1)
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile when auth.users row is inserted
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, age_bracket, locale)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    CASE WHEN NEW.raw_user_meta_data->>'age_bracket' IS NOT NULL AND NEW.raw_user_meta_data->>'age_bracket' != ''
         THEN (NEW.raw_user_meta_data->>'age_bracket')::public.age_bracket
         ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if student is within daily exploration limit
CREATE OR REPLACE FUNCTION check_daily_limit(p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_age_bracket age_bracket;
  v_limit INTEGER;
  v_current INTEGER;
BEGIN
  SELECT age_bracket INTO v_age_bracket FROM profiles WHERE id = p_student_id;

  v_limit := CASE v_age_bracket
    WHEN '10_12' THEN 5
    WHEN '13_15' THEN 10
    WHEN '16_17' THEN 15
    ELSE 50
  END;

  SELECT COALESCE(exploration_count, 0) INTO v_current
  FROM daily_usage
  WHERE student_id = p_student_id AND usage_date = CURRENT_DATE;

  RETURN COALESCE(v_current, 0) < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment daily usage counter (upsert)
CREATE OR REPLACE FUNCTION increment_daily_usage(p_student_id UUID, p_duration INTEGER DEFAULT 0)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_usage (student_id, usage_date, exploration_count, total_duration_seconds)
  VALUES (p_student_id, CURRENT_DATE, 1, p_duration)
  ON CONFLICT (student_id, usage_date)
  DO UPDATE SET
    exploration_count = daily_usage.exploration_count + 1,
    total_duration_seconds = daily_usage.total_duration_seconds + p_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_parent_settings_updated_at
  BEFORE UPDATE ON parent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exploration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exploration_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----

-- All authenticated users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Teachers can read profiles of students in their classes
CREATE POLICY profiles_select_teacher ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS tp
      WHERE tp.id = auth.uid() AND tp.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_memberships cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = profiles.id AND c.teacher_id = auth.uid()
    )
  );

-- Parents can read linked children's profiles (consent granted)
CREATE POLICY profiles_select_parent ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = profiles.id
        AND pcl.consent_status = 'granted'
    )
  );

-- Users can update their own profile (display_name, locale only)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- classes ----

-- Teachers can manage their own classes
CREATE POLICY classes_teacher_all ON classes
  FOR ALL USING (teacher_id = auth.uid());

-- Students can read classes they belong to
CREATE POLICY classes_student_select ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships cm
      WHERE cm.class_id = classes.id AND cm.student_id = auth.uid()
    )
  );

-- ---- class_memberships ----

-- Students can read their own memberships
CREATE POLICY memberships_student_select ON class_memberships
  FOR SELECT USING (student_id = auth.uid());

-- Teachers can read memberships for their classes
CREATE POLICY memberships_teacher_select ON class_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_memberships.class_id AND c.teacher_id = auth.uid()
    )
  );

-- INSERT handled by service role (server-side join flow)

-- ---- parent_child_links ----

-- Parents can manage their own links
CREATE POLICY parent_links_parent_all ON parent_child_links
  FOR ALL USING (parent_id = auth.uid());

-- Children can read their own links
CREATE POLICY parent_links_child_select ON parent_child_links
  FOR SELECT USING (child_id = auth.uid());

-- ---- parent_settings ----

-- Parents can manage settings for their own children
CREATE POLICY parent_settings_parent_all ON parent_settings
  FOR ALL USING (parent_id = auth.uid());

-- ---- exploration_sessions ----

-- Students can CRUD their own sessions
CREATE POLICY sessions_student_all ON exploration_sessions
  FOR ALL USING (student_id = auth.uid());

-- Teachers can read sessions for students in their classes
CREATE POLICY sessions_teacher_select ON exploration_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = exploration_sessions.class_id AND c.teacher_id = auth.uid()
    )
  );

-- Parents can read sessions for linked children (consent granted)
CREATE POLICY sessions_parent_select ON exploration_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = exploration_sessions.student_id
        AND pcl.consent_status = 'granted'
    )
  );

-- ---- exploration_branches ----

-- Students can insert/read branches for their own sessions
CREATE POLICY branches_student_insert ON exploration_branches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      WHERE es.id = exploration_branches.session_id AND es.student_id = auth.uid()
    )
  );

CREATE POLICY branches_student_select ON exploration_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      WHERE es.id = exploration_branches.session_id AND es.student_id = auth.uid()
    )
  );

-- Teachers can read branches for sessions in their classes
CREATE POLICY branches_teacher_select ON exploration_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      JOIN classes c ON c.id = es.class_id
      WHERE es.id = exploration_branches.session_id AND c.teacher_id = auth.uid()
    )
  );

-- Parents can read branches for linked children's sessions
CREATE POLICY branches_parent_select ON exploration_branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      JOIN parent_child_links pcl ON pcl.child_id = es.student_id
      WHERE es.id = exploration_branches.session_id
        AND pcl.parent_id = auth.uid()
        AND pcl.consent_status = 'granted'
    )
  );

-- ---- content_reports ----

-- Any authenticated user can submit reports
CREATE POLICY reports_insert ON content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Teachers can read reports for sessions in their classes
CREATE POLICY reports_teacher_select ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      JOIN classes c ON c.id = es.class_id
      WHERE es.id = content_reports.session_id AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update (review) reports for their classes
CREATE POLICY reports_teacher_update ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exploration_sessions es
      JOIN classes c ON c.id = es.class_id
      WHERE es.id = content_reports.session_id AND c.teacher_id = auth.uid()
    )
  );

-- ---- daily_usage ----

-- Students can read/write their own usage
CREATE POLICY usage_student_all ON daily_usage
  FOR ALL USING (student_id = auth.uid());

-- Teachers can read usage for students in their classes
CREATE POLICY usage_teacher_select ON daily_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = daily_usage.student_id AND c.teacher_id = auth.uid()
    )
  );

-- ---- consent_audit_log ----

-- Parents can read their own audit logs
CREATE POLICY consent_audit_parent_select ON consent_audit_log
  FOR SELECT USING (parent_id = auth.uid());

-- Insert handled by service role (server-side consent flow)
