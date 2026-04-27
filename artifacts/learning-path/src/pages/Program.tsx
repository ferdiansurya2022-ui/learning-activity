import { useLocation, useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { ChevronRight, Folder, Users, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Session, ProgramStructure, Score, User } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { useGetData, useGetAllScores } from "@/lib/apps-script";
import { PASSING_SCORE } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export default function Program() {
  const { program: programParam } = useParams();
  const programName = decodeURIComponent(programParam || "");
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

  if (!session || isDataLoading || isScoresLoading || !allData) {
    return (
      <AppShell title="Loading..." backTo="/dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  const programStructure = allData.program_structure.filter(p => p.program === programName);
  const progresses = Array.from(new Set(programStructure.map(p => p.progress)));

  // For developers, compute participant progress
  const participants = allData.users.filter(u => u.program === programName && u.role === "participant");
  
  return (
    <AppShell title={programName} backTo="/dashboard">
      <div className="space-y-8">
        
        {session.role === "developer" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-slate-900">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Participant Progress</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {participants.map((participant, idx) => {
                const pScores = (allScores || []).filter(s => s.username === participant.username);
                
                // Overall progress
                const totalTestsInProgram = programStructure.length;
                let passedTests = 0;
                programStructure.forEach(test => {
                  const bestScore = Math.max(
                    0, 
                    ...pScores.filter(s => s.test_name === test.test_name).map(s => s.score)
                  );
                  if (bestScore >= PASSING_SCORE) passedTests++;
                });
                const overallPercent = totalTestsInProgram === 0 ? 0 : Math.round((passedTests / totalTestsInProgram) * 100);

                return (
                  <motion.div key={participant.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <Collapsible>
                          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                                {participant.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{participant.username}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <Progress value={overallPercent} className="flex-1 h-2" />
                                  <span className="text-sm font-medium text-slate-500 w-12 text-right">{overallPercent}%</span>
                                </div>
                              </div>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="shrink-0">
                                Lihat Detail <ChevronDown className="w-4 h-4 ml-2" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          
                          <CollapsibleContent className="bg-slate-50 p-6 border-t border-slate-100">
                            <div className="space-y-4">
                              {progresses.map(prog => {
                                const testsInProg = programStructure.filter(p => p.progress === prog);
                                let passedInProg = 0;
                                testsInProg.forEach(test => {
                                  const bestScore = Math.max(
                                    0, 
                                    ...pScores.filter(s => s.test_name === test.test_name).map(s => s.score)
                                  );
                                  if (bestScore >= PASSING_SCORE) passedInProg++;
                                });
                                const progPercent = testsInProg.length === 0 ? 0 : Math.round((passedInProg / testsInProg.length) * 100);
                                
                                return (
                                  <div key={prog} className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium text-slate-700 w-1/3 truncate">{prog}</span>
                                    <Progress value={progPercent} className="flex-1 h-2 bg-slate-200" />
                                    <span className="text-sm text-slate-500 w-12 text-right">{progPercent}%</span>
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
              {participants.length === 0 && (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 border-dashed text-slate-500">
                  No participants found for this program.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-900">
            <Folder className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Menu Progress</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progresses.map((prog, i) => (
              <motion.div key={prog} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-start h-full justify-between gap-6">
                    <div className="w-full">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                        <Folder className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg text-slate-900 line-clamp-2">{prog}</h3>
                    </div>
                    <Button asChild className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                      <Link href={`/program/${encodeURIComponent(programName)}/${encodeURIComponent(prog)}`}>
                        OPEN
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
