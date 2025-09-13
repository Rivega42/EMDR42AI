import { Button } from "@/components/ui/button";
import { Play, Shield, Users, Video } from "lucide-react";
import heroImage from "@assets/generated_images/EMDR_терапия_сессия_4db545e2.png";

export default function LandingHero() {
  return (
    <div className="relative bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Hero content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground">
                Профессиональная{" "}
                <span className="text-primary">EMDR терапия</span>{" "}
                онлайн
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Безопасная и эффективная платформа для работы с ПТСР синдромом. 
                Видео-консультации с сертифицированными специалистами и 
                интерактивные сессии терапии.
              </p>
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6"
                data-testid="button-therapist-signup"
              >
                <Users className="w-5 h-5 mr-2" />
                Для психологов
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 bg-background/80 backdrop-blur-sm"
                data-testid="button-patient-signup"
              >
                <Video className="w-5 h-5 mr-2" />
                Для пациентов
              </Button>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Безопасно и конфиденциально</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Play className="w-4 h-4 text-blue-600" />
                <span>Интерактивные сессии</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Сертифицированные врачи</span>
              </div>
            </div>
          </div>
          
          {/* Hero image */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/20 rounded-2xl p-8 backdrop-blur-sm">
              <img 
                src={heroImage} 
                alt="EMDR терапия сессия" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent rounded-2xl" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              24/7 поддержка
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Научно доказано
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}