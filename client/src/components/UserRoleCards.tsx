import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, UserCheck, Shield, ArrowRight } from "lucide-react";

const roles = [
  {
    role: 'patient',
    title: 'Пациенты',
    description: 'Получайте профессиональную помощь в борьбе с травмой и ПТСР',
    features: [
      'Онлайн сессии с психологом',
      'Интерактивные упражнения',
      'Отслеживание прогресса',
      'Конфиденциальность'
    ],
    icon: User,
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    iconColor: 'text-blue-600',
    buttonText: 'Начать терапию'
  },
  {
    role: 'therapist',
    title: 'Психологи',
    description: 'Помогайте людям с помощью современных инструментов EMDR',
    features: [
      'Полный контроль над сессией',
      'Инструменты билатеральной стимуляции',
      'Богатые приглашения',
      'Аналитика сессий'
    ],
    icon: UserCheck,
    color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    iconColor: 'text-green-600',
    buttonText: 'Присоединиться'
  },
  {
    role: 'admin',
    title: 'Администраторы',
    description: 'Управление платформой и контроль качества оказания услуг',
    features: [
      'Управление пользователями',
      'Мониторинг системы',
      'Отчёты и аналитика',
      'Контроль качества'
    ],
    icon: Shield,
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    iconColor: 'text-purple-600',
    buttonText: 'Панель управления'
  }
];

export default function UserRoleCards() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Выберите свою роль
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            EMDR42 предлагает специализированные инструменты для каждого типа пользователей
          </p>
        </div>

        {/* Role cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roles.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.role} 
                className={`hover-elevate ${role.color} relative overflow-hidden`}
              >
                {/* Popular badge for therapists */}
                {role.role === 'therapist' && (
                  <div className="absolute -top-1 -right-1">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Популярно
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm`}>
                    <IconComponent className={`w-8 h-8 ${role.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Features list */}
                  <ul className="space-y-2">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${role.iconColor.replace('text-', 'bg-')} mt-2 flex-shrink-0`}></div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA button */}
                  <Button 
                    className="w-full" 
                    variant={role.role === 'therapist' ? 'default' : 'outline'}
                    data-testid={`button-${role.role}-signup`}
                    onClick={() => console.log(`Клик по роли: ${role.role}`)}
                  >
                    {role.buttonText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Нуждаетесь в помощи? Обратитесь к нашей службе поддержки
          </p>
          <Button variant="ghost" data-testid="button-contact-support">
            Связаться с нами
          </Button>
        </div>
      </div>
    </section>
  );
}