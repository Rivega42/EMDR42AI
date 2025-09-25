import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" data-testid="loading-spinner" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Проверка аутентификации
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Пожалуйста, подождите, пока мы проверяем ваши учетные данные...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}