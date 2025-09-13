import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, UserCheck, Shield } from "lucide-react";

interface LoginModalProps {
  trigger: React.ReactNode;
  onLogin?: (user: { email: string; role: string; name: string }) => void;
}

export default function LoginModal({ trigger, onLogin }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const roleOptions = [
    { value: 'patient', label: 'Пациент', icon: User },
    { value: 'therapist', label: 'Психолог', icon: UserCheck },
    { value: 'admin', label: 'Администратор', icon: Shield }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Воход с данными:', loginForm);
    
    //todo: remove mock functionality
    const mockUser = {
      email: loginForm.email,
      name: 'Дмитрий Петров',
      role: 'therapist'
    };
    
    onLogin?.(mockUser);
    setIsOpen(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    console.log('Регистрация с данными:', registerForm);
    
    //todo: remove mock functionality
    const mockUser = {
      email: registerForm.email,
      name: registerForm.name,
      role: registerForm.role
    };
    
    onLogin?.(mockUser);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Добро пожаловать в EMDR42</DialogTitle>
          <DialogDescription className="text-center">
            Войдите в свой аккаунт или создайте новый
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Воход</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Регистрация</TabsTrigger>
          </TabsList>
          
          {/* Login tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    data-testid="input-login-email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    className="pl-10 pr-10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    data-testid="input-login-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" data-testid="button-submit-login">
                Войти
              </Button>
              
              <div className="text-center">
                <Button variant="ghost" className="text-sm" data-testid="button-forgot-password">
                  Забыли пароль?
                </Button>
              </div>
            </form>
          </TabsContent>
          
          {/* Register tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Полное имя</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Иван Петров"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  data-testid="input-register-name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    data-testid="input-register-email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-role">Роль</Label>
                <Select 
                  value={registerForm.role} 
                  onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}
                >
                  <SelectTrigger data-testid="select-register-role">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => {
                      const IconComponent = role.icon;
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{role.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Мин. 8 символов"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    data-testid="input-register-password"
                    minLength={8}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Повторить</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Повторите пароль"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    data-testid="input-register-confirm"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" data-testid="button-submit-register">
                Создать аккаунт
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}