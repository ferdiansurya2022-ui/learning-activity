import { useLocation, useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { ChevronRight, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Session } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { useGetData } from "@/lib/apps-script";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  const { program: programParam, progress: progressParam } = useParams();
  const programName = decodeURIComponent(programParam || "");
  const progressName = decodeURIComponent(progressParam || "");
  
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  const { data: allData, isLoading } = useGetData();

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    setSession(JSON.parse(sessionStr));
  }, [setLocation]);

  if (!session || isLoading || !allData) {
    return (
      <AppShell title="Loading..." backTo={`/program/${encodeURIComponent(programName)}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AppShell>
    );
  }

  const programStructure = allData.program_structure.filter(
    p => p.program === programName && p.progress === progressName
  );
  
  const testGroups = Array.from(new Set(programStructure.map(p => p.test_group)));

  return (
    <AppShell title={programName} backTo={`/program/${encodeURIComponent(programName)}`}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <p className="text-primary-foreground/80 font-medium tracking-wide uppercase text-sm mb-1">IN CLASS</p>
          <h1 className="text-3xl font-bold">{progressName.toUpperCase()}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testGroups.map((group, i) => (
            <motion.div key={group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900">{group}</h3>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/program/${encodeURIComponent(programName)}/${encodeURIComponent(progressName)}/${encodeURIComponent(group)}`}>
                      OPEN
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {testGroups.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              No test groups found for this progress.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
