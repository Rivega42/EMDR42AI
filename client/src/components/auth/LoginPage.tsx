import { Shield, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" data-testid="icon-shield" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Требуется авторизация
          </CardTitle>
          <CardDescription>
            Для доступа к этой части системы необходимо войти в свою учетную запись
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Безопасная аутентификация через Replit</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Защищенный доступ к EMDR платформе</span>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            Войти через Replit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              После входа вы будете перенаправлены обратно в приложение
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}