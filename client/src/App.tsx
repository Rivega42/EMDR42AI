import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute, TherapistRoute, PatientRoute } from "@/components/auth/ProtectedRoute";
import Home from "@/pages/Home";
import LoginPage from "@/pages/LoginPage";
import PatientDashboardPage from "@/pages/PatientDashboardPage";
import TherapistDashboardPage from "@/pages/TherapistDashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSessionsPage from "@/pages/AdminSessionsPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";
import AdminSystemPage from "@/pages/AdminSystemPage";
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
      <Route path="/login" component={LoginPage} />
      
      {/* Patient routes - accessible by patients, therapists, and admins */}
      <Route path="/patient">
        <PatientRoute>
          <PatientDashboardPage />
        </PatientRoute>
      </Route>
      <Route path="/patient/settings">
        <PatientRoute>
          <PatientSettingsPage />
        </PatientRoute>
      </Route>
      <Route path="/patient/session">
        <PatientRoute>
          <PatientSessionPage />
        </PatientRoute>
      </Route>
      
      {/* Therapist routes - accessible by therapists and admins */}
      <Route path="/therapist">
        <TherapistRoute>
          <TherapistDashboardPage />
        </TherapistRoute>
      </Route>
      <Route path="/therapist/settings">
        <TherapistRoute>
          <TherapistSettingsPage />
        </TherapistRoute>
      </Route>
      <Route path="/therapist/session">
        <TherapistRoute>
          <TherapistSessionPage />
        </TherapistRoute>
      </Route>
      
      {/* Admin routes - PROTECTED: Only accessible by admin users */}
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboardPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/sessions">
        <AdminRoute>
          <AdminSessionsPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute>
          <AdminUsersPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/analytics">
        <AdminRoute>
          <AdminAnalyticsPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/system">
        <AdminRoute>
          <AdminSystemPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/settings">
        <AdminRoute>
          <AdminSettingsPage />
        </AdminRoute>
      </Route>
      
      {/* General routes - accessible by authenticated users */}
      <Route path="/analytics">
        <TherapistRoute>
          <AnalyticsPage />
        </TherapistRoute>
      </Route>
      <Route path="/session">
        <PatientRoute>
          <EMDRSessionPage />
        </PatientRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
