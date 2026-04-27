import { useLocation, useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Eye, Users, FileQuestion, Pencil, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Session, ProgramStructure } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { useGetData, useGetAllScores, useSaveAICriteria, useGetAICriteria, useGetQuestions } from "@/lib/apps-script";
import { PASSING_SCORE } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function DeveloperTestRow({ test, allScores }: { test: ProgramStructure, allScores: any[] }) {
  const { data: aiCriteria } = useGetAICriteria(test.test_name);
  const { data: questions } = useGetQuestions(test.test_name);
  const saveAICriteria = useSaveAICriteria();

  const [aiEnabled, setAiEnabled] = useState(false);
  const [criteriaText, setCriteriaText] = useState("");

  useEffect(() => {
    if (aiCriteria) {
      setAiEnabled(!!aiCriteria.ai_enabled);
      setCriteriaText(aiCriteria.criteria || "");
    }
  }, [aiCriteria]);

  const testScores = allScores.filter(s => s.test_name === test.test_name);
  const participantCount = new Set(testScores.map(s => s.username)).size;
  const questionCount = questions?.length || 0;
  const hasQuestions = questionCount > 0;

  const handleToggle = (checked: boolean) => {
    setAiEnabled(checked);
    saveAICriteria.mutate({
      test_name: test.test_name,
      ai_enabled: checked,
      criteria: criteriaText,
    });
  };

  const handleSaveCriteria = () => {
    saveAICriteria.mutate({
      test_name: test.test_name,
      ai_enabled: aiEnabled,
      criteria: criteriaText,
    }, {
      onSuccess: () => toast.success("Kriteria AI disimpan"),
    });
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardContent className="p-0">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-slate-900 truncate">{test.test_name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4" /> {questionCount} soal
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {participantCount} peserta mengerjakan
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-slate-600">AI Grading</span>
              <Switch
                checked={aiEnabled}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
              />
              <Badge variant="outline" className={aiEnabled ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"}>
                {aiEnabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className={hasQuestions ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary hover:bg-primary/90 text-white"}>
              <Link href={`/builder/${encodeURIComponent(test.test_name)}`}>
                <Pencil className="w-4 h-4 mr-2" /> {hasQuestions ? "Edit Soal" : "Buat Soal"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/score-participant/${encodeURIComponent(test.test_name)}`}>
                <Users className="w-4 h-4 mr-2" /> Lihat Peserta
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-500">
              <Link href={`/quiz/${encodeURIComponent(test.test_name)}?preview=1`}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Link>
            </Button>
          </div>

          {aiEnabled && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <label className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
                <Sparkles className="w-4 h-4" /> Kriteria Penilaian AI
              </label>
              <Textarea
                value={criteriaText}
                onChange={e => setCriteriaText(e.target.value)}
                placeholder="Masukkan rubrik atau instruksi penilaian untuk AI..."
                className="bg-white border-blue-200 focus-visible:ring-blue-500 min-h-[100px]"
              />
              <button
                onClick={handleSaveCriteria}
                className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors disabled:opacity-50"
                disabled={saveAICriteria.isPending}
              >
                {saveAICriteria.isPending ? "Menyimpan..." : "Simpan kriteria"}
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestGroup() {
  const { program: programParam, progress: progressParam, testGroup: groupParam } = useParams();
  const programName = decodeURIComponent(programParam || "");
  const progressName = decodeURIComponent(progressParam || "");
  const testGroupName = decodeURIComponent(groupParam || "");
  
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const { data: allData, isLoading: isDataLoading } = useGetData();
  const { data: allScores, isLoading: isScoresLoading } = useGetAllScores();

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    setSession(JSON.parse(sessionStr));
  }, [setLocation]);

  if (!session || isDataLoading || isScoresLoading || !allData || !allScores) {
    return (
      <AppShell title="Loading..." backTo={`/program/${encodeURIComponent(programName)}/${encodeURIComponent(progressName)}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  const tests = allData.program_structure
    .filter(p => p.program === programName && p.progress === progressName && p.test_group === testGroupName)
    .sort((a, b) => a.order - b.order);

  const userScores = allScores.filter(s => s.username === session.username);

  return (
    <AppShell title={testGroupName} backTo={`/program/${encodeURIComponent(programName)}/${encodeURIComponent(progressName)}`}>
      <div className="space-y-6">

        {session.role === "developer" && (
          <Card className="bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-sky-700">Developer Mode</p>
                <p className="text-slate-700 text-sm mt-0.5">
                  Kelola soal, aktifkan penilaian AI, dan pantau jawaban peserta untuk setiap assignment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {session.role === "participant" && (
          <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Progress</p>
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {progressName}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1">Passing Score</p>
                <Badge variant="outline" className="text-base font-semibold border-emerald-200 text-emerald-700 bg-emerald-50">
                  {PASSING_SCORE}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tests.map((test, idx) => {
            if (session.role === "developer") {
              return <DeveloperTestRow key={test.test_name} test={test} allScores={allScores} />;
            }

            // Participant logic
            const testScores = userScores.filter(s => s.test_name === test.test_name);
            const bestScore = testScores.length > 0 ? Math.max(...testScores.map(s => s.score)) : null;
            const passed = bestScore !== null && bestScore >= PASSING_SCORE;

      let unlocked = false;

      if (test.order <= 1) {
        unlocked = true;
      } else {
        const previousTests = tests.filter(t => t.order < test.order);

        unlocked = previousTests.every(prevTest => {
          const prevScores = userScores.filter(s => s.test_name === prevTest.test_name);
          const prevBest = prevScores.length > 0 ? Math.max(...prevScores.map(s => s.score)) : 0;
          return prevBest >= PASSING_SCORE;
        });
      }

            return (
              <motion.div key={test.test_name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className={`overflow-hidden border-slate-200 transition-all ${unlocked ? 'hover:shadow-md' : 'opacity-75 bg-slate-50'}`}>
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        {passed ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        ) : !unlocked ? (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{test.test_name}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                          {bestScore !== null ? `Best Score: ${bestScore}` : "Not attempted"}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      asChild={unlocked}
                      disabled={!unlocked}
                      variant={unlocked ? "default" : "secondary"}
                      className={!unlocked ? "bg-slate-200 text-slate-500 cursor-not-allowed" : ""}
                    >
                      {unlocked ? (
                        <Link href={`/quiz/${encodeURIComponent(test.test_name)}`}>OPEN</Link>
                      ) : (
                        <span>LOCKED</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {tests.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              No tests found in this group.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
