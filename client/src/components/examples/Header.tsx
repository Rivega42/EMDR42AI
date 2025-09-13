import Header from '../Header';
import { useState } from 'react';

export default function HeaderExample() {
  const [isDark, setIsDark] = useState(false);
  
  //todo: remove mock functionality
  const mockUser = {
    name: 'Дмитрий Петров',
    role: 'therapist' as const,
    avatar: undefined
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={mockUser}
        onThemeToggle={() => {
          setIsDark(!isDark);
          console.log('Тема сменена на:', !isDark ? 'тёмная' : 'светлая');
        }}
        isDark={isDark}
      />
      <div className="h-96 flex items-center justify-center">
        <p className="text-muted-foreground">Пример шапки сайта</p>
      </div>
    </div>
  );
}