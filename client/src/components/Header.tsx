import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, LogIn } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user?: {
    name: string;
    role: 'patient' | 'therapist' | 'admin';
    avatar?: string;
  };
  onThemeToggle?: () => void;
  isDark?: boolean;
}

export default function Header({ user, onThemeToggle, isDark = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleLabels = {
    patient: 'Пациент',
    therapist: 'Психолог',
    admin: 'Администратор'
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-foreground">EMDR42</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <div className="relative group">
              <a href="/patient" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-patient">
                Пациент
              </a>
              <div className="absolute top-full left-0 mt-2 w-48 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2 space-y-1">
                  <a href="/patient" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-patient-dashboard">
                    Личный кабинет
                  </a>
                  <a href="/patient/settings" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-patient-settings">
                    Настройки
                  </a>
                  <a href="/patient/session" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-patient-session">
                    Моя сессия
                  </a>
                </div>
              </div>
            </div>
            <div className="relative group">
              <a href="/therapist" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-therapist">
                Терапевт
              </a>
              <div className="absolute top-full left-0 mt-2 w-48 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2 space-y-1">
                  <a href="/therapist" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-therapist-dashboard">
                    Личный кабинет
                  </a>
                  <a href="/therapist/settings" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-therapist-settings">
                    Настройки
                  </a>
                  <a href="/therapist/session" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-therapist-session">
                    Управление сессией
                  </a>
                </div>
              </div>
            </div>
            <div className="relative group">
              <a href="/admin" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-admin">
                Админ
              </a>
              <div className="absolute top-full left-0 mt-2 w-48 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2 space-y-1">
                  <a href="/admin" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-admin-dashboard">
                    Админ панель
                  </a>
                  <a href="/admin/settings" className="block px-2 py-1 text-sm hover:bg-accent rounded" data-testid="link-admin-settings">
                    Настройки системы
                  </a>
                </div>
              </div>
            </div>
            <a href="/session" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-session">
              EMDR Игра
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="w-9 h-9"
              data-testid="button-theme-toggle"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* User menu or login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {roleLabels[user.role]}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-profile">
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-dashboard">
                    Личный кабинет
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-sessions">
                    Мои сессии
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-logout">
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Войти
                </Button>
                <Button data-testid="button-signup">
                  Регистрация
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="space-y-1">
                <p className="px-3 py-1 text-sm font-medium text-foreground">Пациент</p>
                <a href="/patient" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-patient">
                  Личный кабинет
                </a>
                <a href="/patient/settings" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-patient-settings">
                  Настройки
                </a>
                <a href="/patient/session" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-patient-session">
                  Моя сессия
                </a>
              </div>
              <div className="space-y-1 pt-2">
                <p className="px-3 py-1 text-sm font-medium text-foreground">Терапевт</p>
                <a href="/therapist" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-therapist">
                  Личный кабинет
                </a>
                <a href="/therapist/settings" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-therapist-settings">
                  Настройки
                </a>
                <a href="/therapist/session" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-therapist-session">
                  Управление сессией
                </a>
              </div>
              <div className="space-y-1 pt-2">
                <p className="px-3 py-1 text-sm font-medium text-foreground">Админ</p>
                <a href="/admin" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-admin">
                  Админ панель
                </a>
                <a href="/admin/settings" className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-mobile-admin-settings">
                  Настройки системы
                </a>
              </div>
              <div className="pt-2">
                <a href="/session" className="block px-3 py-2 text-base text-muted-foreground hover:text-foreground" data-testid="link-mobile-session">
                  EMDR Игра
                </a>
              </div>
              {!user && (
                <div className="px-3 py-2 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Войти
                  </Button>
                  <Button className="w-full" data-testid="button-mobile-signup">
                    Регистрация
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}