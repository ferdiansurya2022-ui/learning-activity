import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronUp, ChevronDown, Trash2, Plus, Save, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Session, Question } from "@/lib/types";
import { useGetQuestions, useSaveQuestion } from "@/lib/apps-script";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function Builder() {
  const { testName: testParam } = useParams();
  const testName = decodeURIComponent(testParam || "");
  
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const { data: initialQuestions, isLoading } = useGetQuestions(testName);
  const saveQuestion = useSaveQuestion();

  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [assignmentPassingScore, setAssignmentPassingScore] = useState<number>(75);

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    const sess = JSON.parse(sessionStr);
    if (sess.role !== "developer") {
      setLocation("/dashboard");
      return;
    }
    setSession(sess);
  }, [setLocation]);

  useEffect(() => {
    if (initialQuestions) {
      const sorted = initialQuestions.sort((a, b) => a.question_index - b.question_index).map(q => ({...q}));
      setQuestions(sorted);
      const firstWithScore = sorted.find(q => typeof q.passing_score === "number" && Number.isFinite(q.passing_score));
      if (firstWithScore && typeof firstWithScore.passing_score === "number") {
        setAssignmentPassingScore(firstWithScore.passing_score);
      }
    }
  }, [initialQuestions]);

  if (!session || isLoading) {
    return (
      <AppShell title="Loading..." backTo="/dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  const handleSave = () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text?.trim()) {
        toast.error(`Soal #${i + 1} tidak boleh kosong`);
        return;
      }
      if (q.type === "multiple_choice") {
        let opts: string[] = [];
        try { opts = JSON.parse(q.options || "[]"); } catch(e) {}
        if (opts.length < 2) {
          toast.error(`Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban`);
          return;
        }
        if (!q.correct_answer) {
          toast.error(`Soal #${i + 1} harus memiliki kunci jawaban`);
          return;
        }
      }
    }

    const safePassing = Math.max(0, Math.min(100, Math.round(assignmentPassingScore || 0)));
    const payloadQuestions = questions.map((q, i) => ({
      ...q,
      question_index: i + 1,
      test_name: testName,
      passing_score: safePassing,
    }));

    saveQuestion.mutate({ test_name: testName, questions: payloadQuestions }, {
      onSuccess: () => {
        toast.success("Soal berhasil disimpan!");
        if (window.history.length > 1) window.history.back();
        else setLocation("/dashboard");
      },
      onError: () => {
        toast.error("Gagal menyimpan soal");
      }
    });
  };

  const addQuestion = (type: string) => {
    setQuestions(prev => [
      ...prev,
      {
        type: type as any,
        question_text: "",
        options: type === "multiple_choice" ? JSON.stringify(["Opsi 1", "Opsi 2"]) : "",
        correct_answer: type === "multiple_choice" ? "Opsi 1" : "",
        passing_score: 75,
        point: 10,
        ai_enabled: false,
        media_url: ""
      }
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(prev => {
      const newQ = [...prev];
      newQ[index] = { ...newQ[index], ...updates };
      return newQ;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setQuestions(prev => {
      const newQ = [...prev];
      [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]];
      return newQ;
    });
  };

  const moveDown = (index: number) => {
    if (index === questions.length - 1) return;
    setQuestions(prev => {
      const newQ = [...prev];
      [newQ[index], newQ[index + 1]] = [newQ[index + 1], newQ[index]];
      return newQ;
    });
  };

  const updateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    try {
      const opts = JSON.parse(q.options || "[]");
      const oldVal = opts[optIndex];
      opts[optIndex] = val;
      
      const updates: any = { options: JSON.stringify(opts) };
      if (q.correct_answer === oldVal) {
        updates.correct_answer = val;
      }
      updateQuestion(qIndex, updates);
    } catch(e) {}
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    try {
      const opts = JSON.parse(q.options || "[]");
      opts.splice(optIndex, 1);
      updateQuestion(qIndex, { options: JSON.stringify(opts) });
    } catch(e) {}
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    try {
      const opts = JSON.parse(q.options || "[]");
      opts.push(`Opsi ${opts.length + 1}`);
      updateQuestion(qIndex, { options: JSON.stringify(opts) });
    } catch(e) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation("/dashboard"); }}>Batal</Button>
            <h1 className="font-semibold text-lg text-slate-900 truncate max-w-[200px] sm:max-w-md">
              Pembuat Soal · {testName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saveQuestion.isPending} className="bg-primary hover:bg-primary/90 text-white">
              <Save className="w-4 h-4 mr-2" /> {saveQuestion.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { localStorage.removeItem("session"); setLocation("/"); }}
              className="text-slate-500 hover:text-slate-900"
              title="Log out"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-32">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold text-emerald-700">
                Passing Grade Assignment
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                Skor minimum (0-100) yang harus dicapai peserta pada assignment ini agar dianggap lulus dan membuka assignment berikutnya.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                min={0}
                max={100}
                value={assignmentPassingScore}
                onChange={(e) => setAssignmentPassingScore(Number(e.target.value))}
                className="w-24 h-11 text-center text-lg font-semibold bg-white"
              />
              <span className="text-slate-500 font-medium">/ 100</span>
            </div>
          </CardContent>
        </Card>

        {questions.map((q, idx) => {
          let parsedOptions: string[] = [];
          if (q.type === "multiple_choice") {
            try { parsedOptions = JSON.parse(q.options || "[]"); } catch(e) {}
          }

          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className="border-slate-200 shadow-sm relative group overflow-visible">
                <div className="absolute -left-12 top-4 hidden md:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => moveUp(idx)} disabled={idx === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => moveDown(idx)} disabled={idx === questions.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Soal #{idx + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Pertanyaan" 
                      value={q.question_text || ""}
                      onChange={e => updateQuestion(idx, { question_text: e.target.value })}
                      className="text-base font-medium resize-none focus-visible:ring-1 bg-slate-50 focus:bg-white"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Tipe Soal</Label>
                      <Select value={q.type} onValueChange={(val: any) => updateQuestion(idx, { type: val })}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                          <SelectItem value="short_answer">Isian Singkat</SelectItem>
                          <SelectItem value="essay">Esai</SelectItem>
                          <SelectItem value="image_upload">Upload Gambar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">POIN SOAL</Label>
                      <Input 
                        type="number" 
                        value={q.point || 75} 
                        onChange={e => updateQuestion(idx, { point: Number(e.target.value) })}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <Label className="font-semibold text-slate-700">AI Grading</Label>
                      <p className="text-xs text-slate-500 mt-0.5">Gunakan AI untuk menilai otomatis</p>
                    </div>
                    <Switch 
                      checked={q.ai_enabled} 
                      onCheckedChange={c => updateQuestion(idx, { ai_enabled: c })}
                      disabled={q.type === "multiple_choice"}
                    />
                  </div>

                  {q.type === "multiple_choice" && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Pilihan Jawaban</Label>
                      <RadioGroup value={q.correct_answer || ""} onValueChange={v => updateQuestion(idx, { correct_answer: v })}>
                        {parsedOptions.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-3">
                            <RadioGroupItem value={opt} id={`q${idx}-opt${oIdx}`} />
                            <Input 
                              value={opt} 
                              onChange={e => updateOption(idx, oIdx, e.target.value)}
                              className="flex-1 bg-white"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeOption(idx, oIdx)} disabled={parsedOptions.length <= 2}>
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </RadioGroup>
                      <Button variant="outline" size="sm" onClick={() => addOption(idx)} className="mt-2 text-primary border-primary/20 hover:bg-primary/5">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Pilihan
                      </Button>
                    </div>
                  )}

                  {(q.type === "essay" || q.type === "short_answer") && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Kunci Jawaban / Pembahasan</Label>
                      <Textarea 
                        placeholder={q.ai_enabled ? "Kunci jawaban / knowledge base untuk AI..." : "Kunci jawaban..."}
                        value={q.correct_answer || ""}
                        onChange={e => updateQuestion(idx, { correct_answer: e.target.value })}
                        className="bg-white min-h-[100px]"
                      />
                    </div>
                  )}

                  {q.type === "image_upload" && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Instruksi & Rubrik Penilaian (untuk AI)</Label>
                      <Textarea 
                        placeholder="Detail kriteria penilaian untuk AI..."
                        value={q.correct_answer || ""}
                        onChange={e => updateQuestion(idx, { correct_answer: e.target.value })}
                        className="bg-white min-h-[100px]"
                      />
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {questions.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            Belum ada soal. Klik tombol di bawah untuk menambahkan.
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Select onValueChange={(val) => addQuestion(val)}>
            <SelectTrigger className="w-auto min-w-[200px] h-12 bg-white border-primary text-primary font-semibold hover:bg-primary/5 rounded-full shadow-sm">
              <Plus className="w-5 h-5 mr-2" /> <SelectValue placeholder="Tambah Soal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
              <SelectItem value="short_answer">Isian Singkat</SelectItem>
              <SelectItem value="essay">Esai</SelectItem>
              <SelectItem value="image_upload">Upload Gambar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </main>
    </div>
  );
}
