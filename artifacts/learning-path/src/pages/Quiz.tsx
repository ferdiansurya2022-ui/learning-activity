import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, FileText, ExternalLink, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Session, Question } from "@/lib/types";
import { useGetQuestions, useGetAICriteria, useSaveScore, useGetData } from "@/lib/apps-script";
import { gradeWithAI } from "@/lib/api-grade";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Quiz() {
  const { testName: testParam } = useParams();
  const testName = decodeURIComponent(testParam || "");
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isPreview = searchParams.get("preview") === "1";
  
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const { data: questions, isLoading: isQuestionsLoading } = useGetQuestions(testName);
  const { data: allData, isLoading: isDataLoading } = useGetData();
  const { data: aiCriteria } = useGetAICriteria(testName);
  const saveScore = useSaveScore();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    setSession(JSON.parse(sessionStr));
  }, [setLocation]);

  if (!session || isQuestionsLoading || isDataLoading) {
    return (
      <AppShell title="Loading..." backTo="..">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  if (!questions || questions.length === 0) {
    // Look up form_link
    const testInfo = allData?.program_structure.find(p => p.test_name === testName);
    
    return (
      <AppShell title={testName} backTo="..">
        <Card className="max-w-md mx-auto mt-10">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Quiz Format Eksternal</h2>
            <p className="text-slate-500">Soal ini menggunakan Google Form atau platform eksternal lainnya.</p>
            {testInfo?.form_link ? (
              <Button asChild className="w-full mt-4">
                <a href={testInfo.form_link} target="_blank" rel="noopener noreferrer">
                  Buka Form Asli <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            ) : (
              <p className="text-red-500 text-sm">Link form tidak tersedia.</p>
            )}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const handleImageUpload = (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswers(prev => ({ ...prev, [qIndex]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (isPreview) return;
    setIsSubmitting(true);
    
    try {
      const isTestAiEnabled = aiCriteria?.ai_enabled || false;
      const testCriteria = aiCriteria?.criteria || "";
      
      const gradedAnswers: Record<number, number> = {};
      const feedbacks: Record<number, any> = {};

      const gradingPromises = questions.map(async (q) => {
        const studentAnswer = answers[q.question_index] || "";
        const isQuestionAiEnabled = q.ai_enabled;

        if (q.type === "multiple_choice") {
          const isCorrect = studentAnswer === q.correct_answer;
          gradedAnswers[q.question_index] = isCorrect ? 100 : 0;
          feedbacks[q.question_index] = null;
        } 
        else if (isTestAiEnabled || isQuestionAiEnabled) {
  gradedAnswers[q.question_index] = 0;

  feedbacks[q.question_index] = {
    feedback: "Belum dinilai AI",
    score: 0,
    strengths: "",
    weaknesses: "",
    suggestions: ""
  };
} 
        else {
          gradedAnswers[q.question_index] = studentAnswer ? 100 : 0;
          feedbacks[q.question_index] = { feedback: "Menunggu penilaian manual" };
        }
      });

      await Promise.allSettled(gradingPromises);

      const totalScore = Math.round(
        Object.values(gradedAnswers).reduce((a, b) => a + b, 0) / questions.length
      );

      await saveScore.mutateAsync({
        username: session.username,
        test_name: testName,
        score: totalScore,
        answers,
        feedback: feedbacks,
        submitted_at: new Date().toISOString()
      });

      setSubmitted(true);
    } catch (e) {
      toast.error("Gagal mengirim jawaban. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AppShell title={testName} backTo="..">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-10">
          <Card className="text-center border-0 shadow-lg bg-white">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Jawaban berhasil dikirim!</h2>
                <p className="text-slate-500">Skor akan muncul setelah diproses.</p>
              </div>
              <Button onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation("/dashboard"); }} variant="outline" className="w-full">
                <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AppShell>
    );
  }

  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)]).length;

  return (
    <AppShell title={testName} backTo="..">
      {isPreview && (
        <div className="bg-amber-100 text-amber-800 p-3 rounded-lg mb-6 flex items-center justify-center gap-2 font-medium border border-amber-200">
          <AlertCircle className="w-5 h-5" />
          Mode Preview — jawaban tidak akan disimpan
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6 pb-32">
        {questions.map((q, idx) => (
          <Card key={q.question_index} className="overflow-hidden border-slate-200">
            <CardContent className="p-0">
              <div className="flex bg-slate-50 border-b border-slate-100">
                <div className="w-12 flex-shrink-0 flex justify-center pt-5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {idx + 1}
                  </div>
                </div>
                <div className="py-5 pr-5 flex-1 text-slate-900 font-medium">
                  {q.question_text}
                </div>
              </div>
              <div className="p-6 pl-16">
                {q.type === "multiple_choice" && q.options && (
                  <RadioGroup 
                    value={answers[q.question_index] || ""} 
                    onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.question_index]: val }))}
                    className="space-y-3"
                  >
                    {(() => {
                      try {
                        const opts = JSON.parse(q.options);
                        return (opts as string[]).map((opt, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <RadioGroupItem value={opt} id={`q${q.question_index}-opt${i}`} />
                            <Label htmlFor={`q${q.question_index}-opt${i}`} className="text-base font-normal cursor-pointer leading-tight">
                              {opt}
                            </Label>
                          </div>
                        ));
                      } catch (e) {
                        return <p className="text-red-500">Error parsing options</p>;
                      }
                    })()}
                  </RadioGroup>
                )}

                {(q.type === "essay" || q.type === "short_answer") && (
                  <Textarea 
                    value={answers[q.question_index] || ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.question_index]: e.target.value }))}
                    placeholder="Tulis jawaban Anda di sini..."
                    className="min-h-[120px] bg-white"
                  />
                )}

                {q.type === "image_upload" && (
                  <div className="space-y-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(q.question_index, e)}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
                    />
                    {answers[q.question_index] && (
                      <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-slate-200">
                        <img src={answers[q.question_index]} alt="Preview" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">
            <span className="text-slate-900 font-bold">{answeredCount}</span> dari {questions.length} soal dijawab
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isPreview}
            className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-md w-full sm:w-auto px-8"
            size="lg"
          >
            {isSubmitting ? (
              <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div> Memproses...</>
            ) : "Submit Jawaban"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
