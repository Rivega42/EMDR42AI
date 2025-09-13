import LoginModal from '../LoginModal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LoginModalExample() {
  const [user, setUser] = useState<{email: string; role: string; name: string} | null>(null);
  
  const handleLogin = (userData: {email: string; role: string; name: string}) => {
    setUser(userData);
    console.log('Пользователь вошёл:', userData);
  };
  
  const handleLogout = () => {
    setUser(null);
    console.log('Пользователь вышел');
  };
  
  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {!user ? (
          <>
            <p className="text-muted-foreground mb-4">Пример модального окна авторизации</p>
            <LoginModal 
              trigger={
                <Button size="lg">Открыть авторизацию</Button>
              }
              onLogin={handleLogin}
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border border-card-border">
              <h3 className="font-bold text-lg mb-2">Пользователь авторизован</h3>
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Роль:</strong> {user.role}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">Выйти</Button>
          </div>
        )}
      </div>
    </div>
  );
}