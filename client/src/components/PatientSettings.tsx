import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Camera, 
  Save, 
  Phone, 
  Mail, 
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";
import Header from "./Header";

export default function PatientSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Mock user data
  const user = {
    name: "Анна Петрова",
    email: "anna.petrova@email.com",
    phone: "+7 (555) 123-45-67",
    role: 'patient' as const,
    avatar: "",
    joinDate: "15 марта 2024"
  };

  const [profileData, setProfileData] = useState({
    firstName: "Анна",
    lastName: "Петрова",
    email: "anna.petrova@email.com",
    phone: "+7 (555) 123-45-67",
    birthDate: "1990-05-15",
    bio: "Ищу помощь в преодолении тревожных расстройств через EMDR терапию.",
    emergencyContact: "Петров Михаил +7 (555) 987-65-43",
    language: "ru"
  });

  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    progressUpdates: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const [privacy, setPrivacy] = useState({
    shareProgress: false,
    allowResearch: true,
    sessionRecording: true,
    dataRetention: "1year"
  });

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onThemeToggle={() => setIsDark(!isDark)} isDark={isDark} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Настройки аккаунта</h1>
              <p className="text-muted-foreground">Управляйте своим профилем и предпочтениями</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Пациент
          </Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              <span>Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2" data-testid="tab-notifications">
              <Bell className="w-4 h-4" />
              <span>Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2" data-testid="tab-privacy">
              <Shield className="w-4 h-4" />
              <span>Приватность</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Личные данные</span>
                </CardTitle>
                <CardDescription>
                  Обновите свою личную информацию и контактные данные
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" data-testid="button-change-avatar">
                      <Camera className="w-4 h-4 mr-2" />
                      Изменить фото
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG до 2MB</p>
                  </div>
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input 
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input 
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      data-testid="input-last-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input 
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Дата рождения</Label>
                    <Input 
                      id="birthDate"
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                      data-testid="input-birth-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Язык</Label>
                    <Select value={profileData.language} onValueChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="uk">Українська</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea 
                    id="bio"
                    placeholder="Расскажите немного о себе и ваших целях терапии..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="min-h-[100px]"
                    data-testid="textarea-bio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Экстренный контакт</Label>
                  <Input 
                    id="emergencyContact"
                    placeholder="Имя и телефон контактного лица"
                    value={profileData.emergencyContact}
                    onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    data-testid="input-emergency-contact"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Безопасность</span>
                </CardTitle>
                <CardDescription>
                  Управляйте паролем и настройками безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Текущий пароль</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите текущий пароль"
                      data-testid="input-current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input 
                    id="newPassword"
                    type="password"
                    placeholder="Введите новый пароль"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="Подтвердите новый пароль"
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button variant="outline" className="w-full" data-testid="button-change-password">
                  <Lock className="w-4 h-4 mr-2" />
                  Изменить пароль
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Уведомления</span>
                </CardTitle>
                <CardDescription>
                  Настройте, как и когда вы хотите получать уведомления
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Напоминания о сессиях</p>
                      <p className="text-xs text-muted-foreground">За 1 час до начала сессии</p>
                    </div>
                    <Switch 
                      checked={notifications.sessionReminders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sessionReminders: checked }))}
                      data-testid="switch-session-reminders"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Новые сообщения</p>
                      <p className="text-xs text-muted-foreground">От психолога или поддержки</p>
                    </div>
                    <Switch 
                      checked={notifications.newMessages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newMessages: checked }))}
                      data-testid="switch-new-messages"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Обновления прогресса</p>
                      <p className="text-xs text-muted-foreground">Еженедельные отчеты о прогрессе</p>
                    </div>
                    <Switch 
                      checked={notifications.progressUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, progressUpdates: checked }))}
                      data-testid="switch-progress-updates"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Способы доставки</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email уведомления
                        </p>
                        <p className="text-xs text-muted-foreground">На {profileData.email}</p>
                      </div>
                      <Switch 
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                        data-testid="switch-email-notifications"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          SMS уведомления
                        </p>
                        <p className="text-xs text-muted-foreground">На {profileData.phone}</p>
                      </div>
                      <Switch 
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsNotifications: checked }))}
                        data-testid="switch-sms-notifications"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Push уведомления</p>
                        <p className="text-xs text-muted-foreground">В браузере или мобильном приложении</p>
                      </div>
                      <Switch 
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                        data-testid="switch-push-notifications"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Приватность и данные</span>
                </CardTitle>
                <CardDescription>
                  Управляйте конфиденциальностью и использованием ваших данных
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Делиться прогрессом</p>
                      <p className="text-xs text-muted-foreground">Позволить психологу видеть детальный прогресс</p>
                    </div>
                    <Switch 
                      checked={privacy.shareProgress}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, shareProgress: checked }))}
                      data-testid="switch-share-progress"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Участие в исследованиях</p>
                      <p className="text-xs text-muted-foreground">Анонимное использование данных для улучшения платформы</p>
                    </div>
                    <Switch 
                      checked={privacy.allowResearch}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowResearch: checked }))}
                      data-testid="switch-allow-research"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Запись сессий</p>
                      <p className="text-xs text-muted-foreground">Сохранять записи для последующего анализа</p>
                    </div>
                    <Switch 
                      checked={privacy.sessionRecording}
                      onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, sessionRecording: checked }))}
                      data-testid="switch-session-recording"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Хранение данных</Label>
                    <Select value={privacy.dataRetention} onValueChange={(value) => setPrivacy(prev => ({ ...prev, dataRetention: value }))}>
                      <SelectTrigger data-testid="select-data-retention">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6months">6 месяцев</SelectItem>
                        <SelectItem value="1year">1 год</SelectItem>
                        <SelectItem value="2years">2 года</SelectItem>
                        <SelectItem value="permanent">Постоянно</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      После этого периода ваши данные будут автоматически удалены
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-destructive">Опасная зона</h4>
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Удалить аккаунт</p>
                        <p className="text-xs text-muted-foreground">
                          Все ваши данные, сессии и прогресс будут безвозвратно удалены
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" data-testid="button-delete-account">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить аккаунт
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" data-testid="button-cancel">
            Отменить
          </Button>
          <Button data-testid="button-save">
            <Save className="w-4 h-4 mr-2" />
            Сохранить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}