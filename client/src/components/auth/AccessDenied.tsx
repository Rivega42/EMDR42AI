import { XCircle, Home, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface AccessDeniedProps {
  requiredRoles?: string[];
  userRole?: string;
  message?: string;
}

export function AccessDenied({ 
  requiredRoles = [], 
  userRole, 
  message 
}: AccessDeniedProps) {
  const { logout, user } = useAuth();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Администратор',
      therapist: 'Терапевт',
      patient: 'Пациент',
      researcher: 'Исследователь'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" data-testid="icon-access-denied" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Доступ запрещен
          </CardTitle>
          <CardDescription>
            {message || 'У вас недостаточно прав для доступа к этой странице'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Ваша роль:</strong> {getRoleDisplayName(userRole || user?.role || 'неизвестно')}</p>
                {requiredRoles.length > 0 && (
                  <p>
                    <strong>Требуется роль:</strong> {' '}
                    {requiredRoles.map(getRoleDisplayName).join(', ')}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleGoHome}
              className="w-full"
              variant="default"
              data-testid="button-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Вернуться на главную
            </Button>
            
            <Button 
              onClick={handleLogout}
              className="w-full"
              variant="outline"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти из системы
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Если вы считаете, что это ошибка, обратитесь к администратору системы
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}