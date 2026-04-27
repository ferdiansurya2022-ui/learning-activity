import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Program from "@/pages/Program";
import Progress from "@/pages/Progress";
import TestGroup from "@/pages/TestGroup";
import Quiz from "@/pages/Quiz";
import ScoreParticipant from "@/pages/ScoreParticipant";
import Builder from "@/pages/Builder";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    const session = localStorage.getItem("session");
    if (!session && location !== "/") {
      setLocation("/");
    }
  }, [location, setLocation]);

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/program/:program"><ProtectedRoute component={Program} /></Route>
      <Route path="/program/:program/:progress"><ProtectedRoute component={Progress} /></Route>
      <Route path="/program/:program/:progress/:testGroup"><ProtectedRoute component={TestGroup} /></Route>
      <Route path="/quiz/:testName"><ProtectedRoute component={Quiz} /></Route>
      <Route path="/score-participant/:testName"><ProtectedRoute component={ScoreParticipant} /></Route>
      <Route path="/builder/:testName"><ProtectedRoute component={Builder} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <ShadcnToaster />
        <SonnerToaster position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
