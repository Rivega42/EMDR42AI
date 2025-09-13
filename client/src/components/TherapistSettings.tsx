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
  Calendar,
  DollarSign,
  Clock,
  Camera, 
  Save, 
  Phone, 
  Mail, 
  Settings,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X
} from "lucide-react";
import Header from "./Header";

export default function TherapistSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Mock user data
  const user = {
    name: "Доктор Иванова",
    email: "dr.ivanova@email.com",
    role: 'therapist' as const,
    avatar: "",
    joinDate: "10 января 2024"
  };

  const [profileData, setProfileData] = useState({
    firstName: "Елена",
    lastName: "Иванова",
    title: "Доктор психологических наук",
    email: "dr.ivanova@email.com",
    phone: "+7 (555) 234-56-78",
    license: "ПСИ-12345-2020",
    experience: "15",
    bio: "Специалист по EMDR терапии с 15-летним опытом работы. Помогаю людям преодолевать травмы и тревожные расстройства.",
    education: "МГУ, факультет психологии",
    specializations: ["EMDR", "Когнитивно-поведенческая терапия", "Травма-фокусированная терапия"],
    languages: ["ru", "en"],
    website: "www.dr-ivanova.com",
    location: "Москва, Россия"
  });

  const [schedule, setSchedule] = useState({
    timezone: "Europe/Moscow",
    workDays: {
      monday: { enabled: true, start: "09:00", end: "18:00" },
      tuesday: { enabled: true, start: "09:00", end: "18:00" },
      wednesday: { enabled: true, start: "09:00", end: "18:00" },
      thursday: { enabled: true, start: "09:00", end: "18:00" },
      friday: { enabled: true, start: "09:00", end: "18:00" },
      saturday: { enabled: false, start: "10:00", end: "16:00" },
      sunday: { enabled: false, start: "10:00", end: "16:00" }
    },
    sessionDuration: "50",
    breakBetween: "10",
    maxSessionsPerDay: "8"
  });

  const [pricing, setPricing] = useState({
    defaultRate: "5000",
    currency: "RUB",
    sessionTypes: [
      { name: "Индивидуальная EMDR сессия", duration: 50, price: 5000 },
      { name: "Первичная консультация", duration: 60, price: 4000 },
      { name: "Семейная терапия", duration: 90, price: 7500 }
    ],
    packages: [
      { name: "Пакет из 5 сессий", sessions: 5, price: 22500, discount: 10 },
      { name: "Пакет из 10 сессий", sessions: 10, price: 40000, discount: 20 }
    ]
  });

  const [notifications, setNotifications] = useState({
    newBookings: true,
    cancellations: true,
    reminders: true,
    messages: true,
    payments: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const dayNames = {
    monday: "Понедельник",
    tuesday: "Вторник", 
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onThemeToggle={() => setIsDark(!isDark)} isDark={isDark} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Настройки специалиста</h1>
              <p className="text-muted-foreground">Управляйте профилем, расписанием и тарифами</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
            Психолог
          </Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              <span>Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2" data-testid="tab-schedule">
              <Calendar className="w-4 h-4" />
              <span>Расписание</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-2" data-testid="tab-pricing">
              <DollarSign className="w-4 h-4" />
              <span>Тарифы</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2" data-testid="tab-notifications">
              <Bell className="w-4 h-4" />
              <span>Уведомления</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Профессиональная информация</span>
                </CardTitle>
                <CardDescription>
                  Обновите свою профессиональную информацию и квалификацию
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-green-500 text-white text-lg">
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
                    <Label htmlFor="title">Специализация</Label>
                    <Input 
                      id="title"
                      value={profileData.title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license">Номер лицензии</Label>
                    <Input 
                      id="license"
                      value={profileData.license}
                      onChange={(e) => setProfileData(prev => ({ ...prev, license: e.target.value }))}
                      data-testid="input-license"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Опыт работы (лет)</Label>
                    <Input 
                      id="experience"
                      type="number"
                      value={profileData.experience}
                      onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                      data-testid="input-experience"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Местоположение</Label>
                    <Input 
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      data-testid="input-location"
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
                    <Label htmlFor="website">Веб-сайт</Label>
                    <Input 
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      data-testid="input-website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Образование</Label>
                    <Input 
                      id="education"
                      value={profileData.education}
                      onChange={(e) => setProfileData(prev => ({ ...prev, education: e.target.value }))}
                      data-testid="input-education"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea 
                    id="bio"
                    placeholder="Расскажите о своем опыте, подходе к терапии и специализации..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="min-h-[120px]"
                    data-testid="textarea-bio"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Специализации</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{spec}</span>
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setProfileData(prev => ({
                            ...prev,
                            specializations: prev.specializations.filter((_, i) => i !== index)
                          }))}
                        />
                      </Badge>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6"
                      data-testid="button-add-specialization"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить
                    </Button>
                  </div>
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
                <Button variant="outline" className="w-full" data-testid="button-change-password">
                  <Lock className="w-4 h-4 mr-2" />
                  Изменить пароль
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Рабочее расписание</span>
                </CardTitle>
                <CardDescription>
                  Настройте свои рабочие часы и доступность
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Select value={schedule.timezone} onValueChange={(value) => setSchedule(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                        <SelectItem value="Europe/Kiev">Киев (UTC+2)</SelectItem>
                        <SelectItem value="Asia/Almaty">Алматы (UTC+6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionDuration">Длительность сессии (мин)</Label>
                    <Input 
                      id="sessionDuration"
                      type="number"
                      value={schedule.sessionDuration}
                      onChange={(e) => setSchedule(prev => ({ ...prev, sessionDuration: e.target.value }))}
                      data-testid="input-session-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakBetween">Перерыв между сессиями (мин)</Label>
                    <Input 
                      id="breakBetween"
                      type="number"
                      value={schedule.breakBetween}
                      onChange={(e) => setSchedule(prev => ({ ...prev, breakBetween: e.target.value }))}
                      data-testid="input-break-between"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSessions">Максимум сессий в день</Label>
                    <Input 
                      id="maxSessions"
                      type="number"
                      value={schedule.maxSessionsPerDay}
                      onChange={(e) => setSchedule(prev => ({ ...prev, maxSessionsPerDay: e.target.value }))}
                      data-testid="input-max-sessions"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Рабочие дни</h4>
                  {Object.entries(schedule.workDays).map(([day, settings]) => (
                    <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Switch 
                          checked={settings.enabled}
                          onCheckedChange={(checked) => setSchedule(prev => ({
                            ...prev,
                            workDays: {
                              ...prev.workDays,
                              [day]: { ...settings, enabled: checked }
                            }
                          }))}
                          data-testid={`switch-${day}`}
                        />
                        <span className="font-medium">{dayNames[day as keyof typeof dayNames]}</span>
                      </div>
                      {settings.enabled && (
                        <div className="flex items-center space-x-2">
                          <Input 
                            type="time"
                            value={settings.start}
                            onChange={(e) => setSchedule(prev => ({
                              ...prev,
                              workDays: {
                                ...prev.workDays,
                                [day]: { ...settings, start: e.target.value }
                              }
                            }))}
                            className="w-24"
                            data-testid={`input-${day}-start`}
                          />
                          <span>-</span>
                          <Input 
                            type="time"
                            value={settings.end}
                            onChange={(e) => setSchedule(prev => ({
                              ...prev,
                              workDays: {
                                ...prev.workDays,
                                [day]: { ...settings, end: e.target.value }
                              }
                            }))}
                            className="w-24"
                            data-testid={`input-${day}-end`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Тарифы и цены</span>
                </CardTitle>
                <CardDescription>
                  Настройте стоимость ваших услуг
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRate">Базовая ставка</Label>
                    <Input 
                      id="defaultRate"
                      type="number"
                      value={pricing.defaultRate}
                      onChange={(e) => setPricing(prev => ({ ...prev, defaultRate: e.target.value }))}
                      data-testid="input-default-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Валюта</Label>
                    <Select value={pricing.currency} onValueChange={(value) => setPricing(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">₽ Рубли</SelectItem>
                        <SelectItem value="USD">$ Доллары</SelectItem>
                        <SelectItem value="EUR">€ Евро</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Типы сессий</h4>
                    <Button variant="outline" size="sm" data-testid="button-add-session-type">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить тип
                    </Button>
                  </div>
                  {pricing.sessionTypes.map((sessionType, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{sessionType.name}</p>
                        <p className="text-sm text-muted-foreground">{sessionType.duration} минут</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{sessionType.price} ₽</span>
                        <Button variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Пакеты сессий</h4>
                    <Button variant="outline" size="sm" data-testid="button-add-package">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить пакет
                    </Button>
                  </div>
                  {pricing.packages.map((pkg, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.sessions} сессий, скидка {pkg.discount}%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{pkg.price} ₽</span>
                        <Button variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Настройте уведомления о работе с клиентами
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Новые записи</p>
                      <p className="text-xs text-muted-foreground">Уведомления о новых записях клиентов</p>
                    </div>
                    <Switch 
                      checked={notifications.newBookings}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newBookings: checked }))}
                      data-testid="switch-new-bookings"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Отмены и переносы</p>
                      <p className="text-xs text-muted-foreground">Изменения в расписании сессий</p>
                    </div>
                    <Switch 
                      checked={notifications.cancellations}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, cancellations: checked }))}
                      data-testid="switch-cancellations"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Напоминания о сессиях</p>
                      <p className="text-xs text-muted-foreground">За 30 минут до начала</p>
                    </div>
                    <Switch 
                      checked={notifications.reminders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, reminders: checked }))}
                      data-testid="switch-reminders"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Сообщения от клиентов</p>
                      <p className="text-xs text-muted-foreground">Новые сообщения в чате</p>
                    </div>
                    <Switch 
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
                      data-testid="switch-messages"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Платежи</p>
                      <p className="text-xs text-muted-foreground">Поступления и статус оплат</p>
                    </div>
                    <Switch 
                      checked={notifications.payments}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, payments: checked }))}
                      data-testid="switch-payments"
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