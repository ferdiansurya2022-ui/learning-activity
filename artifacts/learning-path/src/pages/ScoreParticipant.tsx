import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { Users, FileSpreadsheet, ChevronDown, CheckCircle2, XCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Session } from "@/lib/types";
import { useGetScores, useGetQuestions } from "@/lib/apps-script";
import { API_BASE, PASSING_SCORE, SPREADSHEET_URL } from "@/lib/config";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";

export default function ScoreParticipant() {
  
  const { testName: testParam } = useParams();
  const testName = decodeURIComponent(testParam || "");
  
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const { data: scores, isLoading: isScoresLoading } = useGetScores(testName);
  const { data: questions, isLoading: isQuestionsLoading } = useGetQuestions(testName);

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    setSession(JSON.parse(sessionStr));
  }, [setLocation]);

  if (!session || isScoresLoading || isQuestionsLoading) {
    return (
      <AppShell title="Loading..." backTo="..">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  // Get latest score for each user
  const latestScores = Object.values(
    (scores || []).reduce((acc, score) => {
      if (!acc[score.username] || new Date(score.submitted_at) > new Date(acc[score.username].submitted_at)) {
        acc[score.username] = score;
      }
      return acc;
    }, {} as Record<string, any>)
  ).sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  const downloadCSV = () => {
    const csvEscape = (val: any) => {
      const s = (val ?? "").toString();
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const sortedQuestions = (questions || []).slice().sort((a, b) => a.question_index - b.question_index);

    const header = [
      "No",
      "Username",
      "Score",
      "Status",
      "Submitted At",
      ...sortedQuestions.flatMap((q, i) => [
        `Soal ${i + 1} - Pertanyaan`,
        `Soal ${i + 1} - Jawaban`,
        `Soal ${i + 1} - Feedback AI`,
      ]),
    ];

    const rows = latestScores.map((s: any, idx: number) => {
      let answers: any = {};
      let feedback: any = {};
      try { answers = JSON.parse(s.answers || "{}"); } catch (e) {}
      try { feedback = JSON.parse(s.feedback || "{}"); } catch (e) {}

      const isPassed = s.score >= PASSING_SCORE;
      const submittedAt = (() => {
        try { return format(new Date(s.submitted_at), "yyyy-MM-dd HH:mm:ss"); } catch { return s.submitted_at; }
      })();

      return [
        idx + 1,
        s.username,
        s.score,
        isPassed ? "Lulus" : "Belum Lulus",
        submittedAt,
        ...sortedQuestions.flatMap((q) => [
          q.question_text || "",
          answers[q.question_index] ?? "",
          feedback[q.question_index]?.feedback ?? "",
        ]),
      ];
    });

    const lines = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = testName.replace(/[^a-zA-Z0-9-_]+/g, "_");
    const stamp = format(new Date(), "yyyyMMdd_HHmmss");
    link.href = url;
    link.download = `hasil_${safeName}_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title={`Skor: ${testName}`} backTo="..">
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-emerald-800/70 mb-1 uppercase tracking-wide">Test Results</p>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">{testName}</h2>
              <div className="flex items-center gap-4 text-emerald-800 font-medium">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {latestScores.length} peserta</span>
                <span>•</span>
                <span>{questions?.length || 0} soal</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={downloadCSV}
                disabled={latestScores.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" /> Unduh CSV
              </Button>
              <Button asChild variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800">
                <a href={SPREADSHEET_URL} target="_blank" rel="noopener noreferrer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Lihat Spreadsheet
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {latestScores.map((scoreObj: any, idx) => {
            const isPassed = scoreObj.score >= PASSING_SCORE;
            let answersObj: any = {};
            let feedbackObj: any = {};
            try {
              answersObj = JSON.parse(scoreObj.answers || "{}");
              feedbackObj = JSON.parse(scoreObj.feedback || "{}");
            } catch (e) {
              console.error("Error parsing score data", e);
            }

            return (
              <motion.div key={scoreObj.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="overflow-hidden border-slate-200">
                  <CardContent className="p-0">
                    <Collapsible>
                      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-inner
                            ${scoreObj.score >= 75 ? 'bg-emerald-500' : scoreObj.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}>
                            {scoreObj.score}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">{scoreObj.username}</h3>
                            <p className="text-sm text-slate-500">
                              Disubmit: {format(new Date(scoreObj.submitted_at), "d MMM yyyy, HH:mm", { locale: id })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={isPassed ? "default" : "destructive"} className={isPassed ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                            {isPassed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {isPassed ? "Lulus" : "Belum Lulus"}
                          </Badge>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Jawaban <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      
                      <CollapsibleContent className="bg-slate-50 border-t border-slate-100">
                        <div className="p-6 space-y-6">
                          {questions?.map((q, qIdx) => {
                            const studentAns = answersObj[q.question_index];
                            const qFeedback = feedbackObj[q.question_index];
                            
                            return (
                              <div key={q.question_index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center justify-center text-xs flex-shrink-0">
                                    {qIdx + 1}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <p className="text-slate-900 font-medium leading-relaxed">{q.question_text}</p>
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Jawaban Peserta:</span>
                                      {q.type === "image_upload" && studentAns ? (
                                        <img src={studentAns} alt="Jawaban" className="max-w-xs rounded border border-slate-200 mt-2" />
                                      ) : (
                                        <p className="text-slate-800 whitespace-pre-wrap">{studentAns || <span className="text-slate-400 italic">Tidak dijawab</span>}</p>
                                      )}
                                    </div>
                                    <button
  
                                    {/* 🔹 TOMBOL SELALU MUNCUL */}
<button
  onClick={async () => {
    try {
      const res = await fetch(`${API_BASE}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: q.question_text,
          answer: studentAns || "",
          knowledge_base: q.correct_answer || "",
          criteria: "Nilai berdasarkan konsep",
          max_score: 100
        })
      });

      const data = await res.json();

      alert("Score: " + data.score + "\n\nFeedback:\n" + data.feedback);
    } catch (err) {
      alert("Gagal menilai AI");
    }
  }}
  className="mb-2 bg-green-600 text-white px-3 py-1 rounded text-sm"
>
  Nilai dengan AI
</button>

{qFeedback?.feedback ? (
  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide block mb-1">
      Feedback AI:
    </span>
    <p className="text-blue-900 text-sm whitespace-pre-wrap">
      {qFeedback.feedback}
    </p>
  </div>
) : (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
    <span className="text-xs text-gray-500 block">
      Belum dinilai AI
    </span>
  </div>
)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {latestScores.length === 0 && (
            <Card className="border-dashed border-slate-300 bg-transparent shadow-none">
              <CardContent className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg">Belum ada peserta yang mengerjakan.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
