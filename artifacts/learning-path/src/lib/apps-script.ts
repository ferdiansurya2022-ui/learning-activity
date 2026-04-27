import { APPS_SCRIPT_URL } from "./config";
import { User, ProgramStructure, Score, Question, AICriteria } from "./types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.append("action", action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

async function fetchPost<T>(payload: any): Promise<T> {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

function explodeUsers(users: User[]): User[] {
  const out: User[] = [];
  for (const u of users) {
    const raw = String(u.program || "").trim();
    if (!raw) {
      out.push(u);
      continue;
    }
    const programs = raw.split(/[,;|\n]+/).map((p) => p.trim()).filter(Boolean);
    if (programs.length <= 1) {
      out.push({ ...u, program: programs[0] || raw });
    } else {
      for (const p of programs) out.push({ ...u, program: p });
    }
  }
  return out;
}

export const appsScript = {
  getData: async () => {
    const data = await fetchGet<{ users: User[]; program_structure: ProgramStructure[] }>("getData");
    return { users: explodeUsers(data.users || []), program_structure: data.program_structure || [] };
  },
  getScores: (testName: string) => fetchGet<Score[]>("getScores", { testName }),
  getAllScores: () => fetchGet<Score[]>("getAllScores"),
  getQuestions: (testName: string) => fetchGet<Question[]>("getQuestions", { testName }),
  getAICriteria: (testName: string) => fetchGet<AICriteria>("getAICriteria", { testName }),

  saveScore: (payload: { username: string; test_name: string; score: number; answers: any; feedback: any; submitted_at: string }) =>
    fetchPost<{ success: boolean }>({
      action: "saveScore",
      ...payload,
      answers: typeof payload.answers === "string" ? payload.answers : JSON.stringify(payload.answers || {}),
      feedback: typeof payload.feedback === "string" ? payload.feedback : JSON.stringify(payload.feedback || {}),
    }),

  saveQuestion: (payload: { test_name: string; questions: Partial<Question>[] }) =>
    fetchPost<{ success: boolean }>({ action: "saveQuestion", ...payload }),

  saveAICriteria: (payload: AICriteria) =>
    fetchPost<{ success: boolean }>({ action: "saveAICriteria", ...payload }),
};

// Hooks
export const useGetData = () => useQuery({
  queryKey: ["data"],
  queryFn: appsScript.getData,
});

export const useGetScores = (testName: string) => useQuery({
  queryKey: ["scores", testName],
  queryFn: () => appsScript.getScores(testName),
  enabled: !!testName,
});

export const useGetAllScores = () => useQuery({
  queryKey: ["allScores"],
  queryFn: appsScript.getAllScores,
});

export const useGetQuestions = (testName: string) => useQuery({
  queryKey: ["questions", testName],
  queryFn: () => appsScript.getQuestions(testName),
  enabled: !!testName,
});

export const useGetAICriteria = (testName: string) => useQuery({
  queryKey: ["aiCriteria", testName],
  queryFn: () => appsScript.getAICriteria(testName),
  enabled: !!testName,
});

export const useSaveScore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appsScript.saveScore,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["scores", variables.test_name] });
      qc.invalidateQueries({ queryKey: ["allScores"] });
    },
  });
};

export const useSaveQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appsScript.saveQuestion,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["questions", variables.test_name] });
    },
  });
};

export const useSaveAICriteria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appsScript.saveAICriteria,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["aiCriteria", variables.test_name] });
    },
  });
};
