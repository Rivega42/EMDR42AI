import { useState } from 'react';
import Header from '@/components/Header';
import LandingHero from '@/components/LandingHero';
import EMDRFeatures from '@/components/EMDRFeatures';
import UserRoleCards from '@/components/UserRoleCards';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    role: 'patient' | 'therapist' | 'admin';
    email: string;
    avatar?: string;
  } | null>(null);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    console.log('Тема сменена на:', !isDark ? 'тёмная' : 'светлая');
  };

  const handleLogin = (userData: { email: string; role: string; name: string }) => {
    setUser({
      ...userData,
      role: userData.role as 'patient' | 'therapist' | 'admin'
    });
    console.log('Пользователь вошёл:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    console.log('Пользователь вышел');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user || undefined}
        onThemeToggle={handleThemeToggle}
        isDark={isDark}
      />
      
      {/* Main content */}
      <main>
        <LandingHero />
        <EMDRFeatures />
        <UserRoleCards />
      </main>
      
      <Footer />
      
      {/* Login modal - hidden by default, triggers from Header */}
      <LoginModal
        trigger={<div style={{ display: 'none' }} />}
        onLogin={handleLogin}
      />
    </div>
  );
}