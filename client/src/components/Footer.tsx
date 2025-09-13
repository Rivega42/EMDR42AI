import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const footerLinks = {
  platform: {
    title: 'Платформа',
    links: [
      { label: 'О EMDR42', href: '/about' },
      { label: 'Как это работает', href: '/how-it-works' },
      { label: 'Цены', href: '/pricing' },
      { label: 'Партнёры', href: '/partners' }
    ]
  },
  therapy: {
    title: 'Терапия',
    links: [
      { label: 'Что такое EMDR', href: '/emdr' },
      { label: 'Показания', href: '/indications' },
      { label: 'Научные исследования', href: '/research' },
      { label: 'Часто задаваемые вопросы', href: '/faq' }
    ]
  },
  specialists: {
    title: 'Специалисты',
    links: [
      { label: 'Найти психолога', href: '/therapists' },
      { label: 'Стать психологом', href: '/join-therapist' },
      { label: 'Для клиник', href: '/for-clinics' },
      { label: 'Обучение', href: '/training' }
    ]
  },
  support: {
    title: 'Поддержка',
    links: [
      { label: 'Контакты', href: '/contact' },
      { label: 'Помощь', href: '/help' },
      { label: 'Блог', href: '/blog' },
      { label: 'Новости', href: '/news' }
    ]
  }
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' }
];

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter signup */}
        <div className="mb-12">
          <div className="bg-card rounded-2xl p-8 lg:p-12 border border-card-border">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl lg:text-3xl font-bold text-card-foreground mb-4">
                Получайте полезные материалы
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Подпишитесь на нашу рассылку и получайте полезные статьи 
                о психотерапии и новости платформы
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Ваш email" 
                  className="flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button data-testid="button-newsletter-subscribe">
                  Подписаться
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Мы не передаём ваши данные третьим лицам
              </p>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-foreground">EMDR42</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Первая в России платформа для онлайн EMDR-терапии. 
              Помогаем людям преодолевать травмы с помощью 
              современных технологий.
            </p>
            
            {/* Contact info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+7 (495) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>info@emdr42.ru</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Москва, Россия</span>
              </div>
            </div>
          </div>

          {/* Footer links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${key}-${index}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 EMDR42. Все права защищены.
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Legal links */}
            <div className="flex items-center space-x-4 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">
                Политика конфиденциальности
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">
                Пользовательское соглашение
              </a>
            </div>
            
            {/* Social links */}
            <div className="flex items-center space-x-2">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    data-testid={`button-social-${social.label.toLowerCase()}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}