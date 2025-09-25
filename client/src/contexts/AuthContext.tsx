import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTherapist: boolean;
  isPatient: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch current user with retry disabled for 401s
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: (failureCount, error) => {
      // Don't retry on 401 Unauthorized
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Mark as initialized once we have a response (success or failure)
  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  const isAuthenticated = !!user && !error;
  const userRole = user?.role || '';

  const hasRole = (role: string): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(userRole);
  };

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    window.location.href = '/api/logout';
  };

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading: isLoading || !isInitialized,
    isAuthenticated,
    isAdmin: hasRole('admin'),
    isTherapist: hasRole('therapist'),
    isPatient: hasRole('patient'),
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}