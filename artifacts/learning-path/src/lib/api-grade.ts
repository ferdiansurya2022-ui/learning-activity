import { API_BASE } from "./config";

export interface AIGradeRequest {
  question: string;
  answer: string;
  knowledge_base?: string;
  criteria?: string;
  max_score: number;
}

export interface AIGradeResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  errors: string[];
  suggestions: string[];
  feedback: string;
}

export async function gradeWithAI(payload: AIGradeRequest): Promise<AIGradeResponse> {
  const res = await fetch(`${API_BASE}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to grade with AI");
  }
  return res.json();
}
