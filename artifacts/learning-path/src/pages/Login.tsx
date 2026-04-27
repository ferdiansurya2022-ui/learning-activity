import { useState } from "react";
import { useLocation } from "wouter";
import { LogIn } from "lucide-react";
import { useGetData } from "@/lib/apps-script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Session } from "@/lib/types";

export default function Login() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetData();
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) {
      toast.error("Data not loaded yet.");
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedAccessCode = accessCode.trim();

    const userRows = data.users.filter(
      (u) => 
        u.username.toLowerCase() === trimmedUsername.toLowerCase() && 
        u.access_code === trimmedAccessCode
    );

    if (userRows.length > 0) {
      const role = userRows[0].role;
      const programs = Array.from(new Set(userRows.map(u => u.program)));
      
      const session: Session = {
        username: userRows[0].username,
        role,
        programs
      };

      localStorage.setItem("session", JSON.stringify(session));
      toast.success("Login successful!");
      setLocation("/dashboard");
    } else {
      toast.error("Invalid username or access code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-4 items-center text-center pb-8 pt-10">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-base text-slate-500">
                Enter your credentials to access your learning path.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessCode" className="text-slate-700 font-medium">Access Code</Label>
                  <Input 
                    id="accessCode" 
                    type="password" 
                    placeholder="Enter your access code" 
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "START LEARNING"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
