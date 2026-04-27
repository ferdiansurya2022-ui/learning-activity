export type Role = "participant" | "developer";

export interface User {
  username: string;
  access_code: string;
  program: string;
  role: Role;
}

export interface ProgramStructure {
  program: string;
  progress: string;
  test_group: string;
  order: number;
  test_name: string;
  form_link?: string;
}

export interface Score {
  username: string;
  test_name: string;
  score: number;
  answers: string; // JSON string
  feedback: string; // JSON string
  submitted_at: string;
}

export interface Question {
  test_name: string;
  question_index: number;
  type: "essay" | "multiple_choice" | "image_upload" | "short_answer";
  question_text: string;
  options?: string; // JSON string of array for multiple choice
  correct_answer?: string;
  passing_score?: number;
  point?: number;
  ai_enabled: boolean;
  media_url?: string;
}

export interface AICriteria {
  test_name: string;
  ai_enabled: boolean;
  criteria: string;
}

export interface Session {
  username: string;
  role: Role;
  programs: string[];
}
