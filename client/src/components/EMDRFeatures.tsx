import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Shield, Video, Gamepad2, Clock, Users } from "lucide-react";
import gameImage from "@assets/generated_images/Терапевтическая_игра_шарик_c6ec22bd.png";

const features = [
  {
    icon: Brain,
    title: "Научно обосновано",
    description: "EMDR - это психотерапевтический метод, признанный ВОЗ для лечения ПТСР и травм"
  },
  {
    icon: Video,
    title: "Онлайн сессии",
    description: "Проводите сессии из любой точки мира с высоким качеством видео и аудио"
  },
  {
    icon: Gamepad2,
    title: "Интерактивные стимулы",
    description: "Специальные игровые модули для билатеральной стимуляции мозга"
  },
  {
    icon: Shield,
    title: "Конфиденциальность",
    description: "Полная защита персональных данных и соблюдение медицинской тайны"
  },
  {
    icon: Clock,
    title: "24/7 Доступность",
    description: "Платформа работает круглосуточно, позволяя проводить сессии в удобное время"
  },
  {
    icon: Users,
    title: "Сертифицированные специалисты",
    description: "Все психологи на платформе имеют специализацию по EMDR-терапии"
  }
];

export default function EMDRFeatures() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Почему выбирают <span className="text-primary">EMDR42</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Мы создали современную платформу, которая объединяет лучшие практики 
            EMDR-терапии с современными технологиями
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="hover-elevate border-card-border bg-card">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Interactive game showcase */}
        <div className="bg-card rounded-2xl p-8 lg:p-12 border border-card-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl lg:text-3xl font-bold text-card-foreground">
                  Интерактивная терапия
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Наша уникальная игровая система помогает пациентам сосредоточиться 
                  на билатеральной стимуляции, а психолог может контролировать 
                  все параметры в реальном времени.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Настройка скорости и направления движения</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Управление звуковыми эффектами</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Фоновая музыка для релаксации</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl p-6">
                <img 
                  src={gameImage} 
                  alt="Терапевтическая игра" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              
              {/* Control indicators */}
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium shadow-lg">
                Полный контроль
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}