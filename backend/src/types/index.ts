// src/types/index.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export type UserRole = 'ceo' | 'lead' | 'engineer' | 'designer' | 'pm';

export type ProjectStatus = 'planning' | 'in_progress' | 'blocked' | 'completed';

export type BlockerSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Team {
  id: number;
  company_id: string;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role?: UserRole;
  slack_user_id?: string;
  github_username?: string;
  is_active: boolean;
}

export interface Project {
  id: number;
  team_id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner_id?: number;
  start_date?: Date;
  deadline?: Date;
  completion_percentage: number;
}

export interface WorkSignal {
  id: number;
  team_id: number;
  user_id: number;
  source: 'slack' | 'github' | 'workspace' | 'figma' | 'jira' | 'zoom';
  signal_type: 'message' | 'commit' | 'doc_edit' | 'design_update' | 'ticket' | 'meeting';
  project_id?: number;
  metadata?: any;
  timestamp: Date;
}
