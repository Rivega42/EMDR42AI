import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import PatientDashboardPage from "@/pages/PatientDashboardPage";
import TherapistDashboardPage from "@/pages/TherapistDashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import EMDRSessionPage from "@/pages/EMDRSessionPage";
import PatientSettingsPage from "@/pages/PatientSettingsPage";
import TherapistSettingsPage from "@/pages/TherapistSettingsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import PatientSessionPage from "@/pages/PatientSessionPage";
import TherapistSessionPage from "@/pages/TherapistSessionPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/patient" component={PatientDashboardPage} />
      <Route path="/therapist" component={TherapistDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/session" component={EMDRSessionPage} />
      <Route path="/patient/settings" component={PatientSettingsPage} />
      <Route path="/therapist/settings" component={TherapistSettingsPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />
      <Route path="/patient/session" component={PatientSessionPage} />
      <Route path="/therapist/session" component={TherapistSessionPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
