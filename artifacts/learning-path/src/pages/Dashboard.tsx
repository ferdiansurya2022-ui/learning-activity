import { useLocation, Link } from "wouter";
import { BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Session } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) {
      setLocation("/");
      return;
    }
    setSession(JSON.parse(sessionStr));
  }, [setLocation]);

  if (!session) return null;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
        >
          <h2 className="text-3xl font-bold text-slate-900">
            Welcome back, <span className="text-primary">{session.username}</span>!
          </h2>
          <p className="mt-2 text-slate-500 text-lg">
            {session.role === "developer" 
              ? "Manage your learning programs and track participant progress." 
              : "Continue your learning journey."}
          </p>
        </motion.div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 px-1">Your Programs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.programs.map((program, i) => (
              <motion.div
                key={program}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/program/${encodeURIComponent(program)}`}>
                  <Card className="h-full hover:shadow-md transition-all duration-200 cursor-pointer border-slate-200 hover:border-primary/30 group">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{program}</CardTitle>
                      <CardDescription>Learning Path</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm font-medium text-primary mt-4 group-hover:translate-x-1 transition-transform">
                        Enter Program <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
            {session.programs.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No programs assigned to you yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
