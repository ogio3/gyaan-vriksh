// Auto-generated types matching supabase/migrations/00001_v2_foundation.sql
// Update this file when schema changes.

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
export type AgeBracket = 'under_10' | '10_12' | '13_15' | '16_17' | 'adult';
export type ExplorationStatus = 'active' | 'completed' | 'abandoned';
// Demo API uses creative names (discovery, innovation, mystery, history)
// Full platform API uses academic names (deeper_topic, application, question)
// Both sets are valid — demo data never hits the DB
export type BranchType =
  | 'career' | 'connection'                                    // shared
  | 'discovery' | 'innovation' | 'mystery' | 'history'         // demo
  | 'deeper_topic' | 'application' | 'question';               // full platform (DB enum)
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type ContentReportType = 'age_inappropriate' | 'incorrect' | 'uncomfortable' | 'other';
export type ReportPriority = 'high' | 'medium' | 'low';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type ConsentStatus = 'pending' | 'granted' | 'withdrawn';
export type ConsentMethod = 'credit_card' | 'government_id' | 'kba';
export type NotificationFrequency = 'realtime' | 'daily' | 'weekly';
export type Locale = 'en' | 'hi' | 'pa' | 'ja';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  age_bracket: AgeBracket | null;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  parent_code: string;
  is_active: boolean;
  max_students: number;
  created_at: string;
  updated_at: string;
}

export interface ClassMembership {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  consent_status: ConsentStatus;
  consent_method: ConsentMethod | null;
  consent_granted_at: string | null;
  consent_hash: string | null;
  created_at: string;
}

export interface ParentSettings {
  id: string;
  parent_id: string;
  child_id: string;
  daily_limit_minutes: number;
  allowed_categories: string[];
  account_paused: boolean;
  notification_frequency: NotificationFrequency;
  created_at: string;
  updated_at: string;
}

export interface ExplorationSession {
  id: string;
  student_id: string;
  class_id: string | null;
  passage_hash: string;
  passage_preview: string | null;
  subject_label: string | null;
  status: ExplorationStatus;
  branch_count: number;
  max_depth_reached: number;
  bloom_level_reached: BloomLevel | null;
  duration_seconds: number | null;
  locale: Locale;
  created_at: string;
  completed_at: string | null;
}

export interface ExplorationBranch {
  id: string;
  session_id: string;
  parent_branch_id: string | null;
  branch_type: BranchType;
  label: string;
  summary: string | null;
  bloom_level: BloomLevel | null;
  depth: number;
  is_expanded: boolean;
  created_at: string;
}

export interface ContentReport {
  id: string;
  session_id: string | null;
  branch_id: string | null;
  reporter_id: string;
  reporter_role: 'student' | 'teacher' | 'parent';
  report_type: ContentReportType;
  report_text: string | null;
  priority: ReportPriority;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface DailyUsage {
  id: string;
  student_id: string;
  usage_date: string;
  exploration_count: number;
  total_duration_seconds: number;
}

export interface ConsentAuditLog {
  id: string;
  parent_id: string;
  child_id: string;
  action: 'granted' | 'withdrawn' | 'updated';
  consent_details: Record<string, unknown>;
  ip_hash: string | null;
  created_at: string;
}
