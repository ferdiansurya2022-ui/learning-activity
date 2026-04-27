import React from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Session } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  backTo?: string;
}

export function AppShell({ children, title = "Learning Path", backTo }: AppShellProps) {
  const [, setLocation] = useLocation();
  const sessionStr = localStorage.getItem("session");
  const session: Session | null = sessionStr ? JSON.parse(sessionStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("session");
    setLocation("/");
  };

  const handleBack = () => {
    if (!backTo) return;
    if (backTo === "..") {
      if (window.history.length > 1) window.history.back();
      else setLocation("/dashboard");
    } else {
      setLocation(backTo);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backTo ? (
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
            ) : (
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <h1 className="font-semibold text-lg text-foreground">{title}</h1>
          </div>
          
          {session && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Logged in as <span className="font-medium text-foreground">{session.username}</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {session.role}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2 hidden sm:block" />
                Log out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
