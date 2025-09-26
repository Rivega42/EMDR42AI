import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { LoginPage } from '@/components/auth/LoginPage';
import { AccessDenied } from '@/components/auth/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles = [], 
  fallback 
}: ProtectedRouteProps) {
  // TEMPORARILY DISABLED - Allow access without authentication
  return <>{children}</>;
}

// Specific route protectors for common use cases
export function AdminRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function TherapistRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "therapist"]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function PatientRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "therapist", "patient"]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}