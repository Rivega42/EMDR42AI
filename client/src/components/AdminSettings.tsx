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
  Settings,
  Camera, 
  Save, 
  Phone, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  Server,
  Database,
  Users,
  AlertTriangle,
  Activity,
  Globe
} from "lucide-react";
import Header from "./Header";

export default function AdminSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Mock user data
  const user = {
    name: "Администратор",
    email: "admin@emdr-platform.com",
    role: 'admin' as const,
    avatar: "",
    joinDate: "1 января 2024"
  };

  const [profileData, setProfileData] = useState({
    firstName: "Иван",
    lastName: "Администратор",
    email: "admin@emdr-platform.com",
    phone: "+7 (555) 000-00-00",
    role: "Главный администратор",
    department: "IT и управление системой"
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: "EMDR Платформа",
    siteDescription: "Профессиональная платформа для EMDR терапии",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    sessionRecordingEnabled: true,
    maxSessionDuration: "120",
    defaultSessionDuration: "50",
    maxUsersPerTherapist: "50",
    dataRetentionPeriod: "2years",
    backupFrequency: "daily",
    timezone: "Europe/Moscow"
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: true,
    passwordMinLength: "8",
    passwordRequireSpecialChars: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    ipWhitelist: "",
    encryptionLevel: "AES256",
    auditLogging: true,
    securityAlerts: true
  });

  const [notifications, setNotifications] = useState({
    systemAlerts: true,
    userRegistrations: true,
    paymentIssues: true,
    securityEvents: true,
    backupStatus: true,
    performanceAlerts: true,
    emailNotifications: true,
    smsNotifications: true,
    slackIntegration: false
  });

  const [userManagement, setUserManagement] = useState({
    autoApproveTherapists: false,
    requireLicenseVerification: true,
    allowGuestSessions: false,
    maxFreeTrialDays: "14",
    inactiveUserCleanup: "90",
    bulkOperationsEnabled: true
  });

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onThemeToggle={() => setIsDark(!isDark)} isDark={isDark} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Настройки системы</h1>
              <p className="text-muted-foreground">Управление платформой, пользователями и безопасностью</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
            Администратор
          </Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2" data-testid="tab-profile">
              <User className="w-4 h-4" />
              <span>Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2" data-testid="tab-system">
              <Server className="w-4 h-4" />
              <span>Система</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2" data-testid="tab-users">
              <Users className="w-4 h-4" />
              <span>Пользователи</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2" data-testid="tab-security">
              <Shield className="w-4 h-4" />
              <span>Безопасность</span>
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
                  <span>Информация администратора</span>
                </CardTitle>
                <CardDescription>
                  Управляйте своим административным профилем
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-purple-500 text-white text-lg">
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
                    <Label htmlFor="role">Роль</Label>
                    <Input 
                      id="role"
                      value={profileData.role}
                      onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                      data-testid="input-role"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Отдел</Label>
                    <Input 
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      data-testid="input-department"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Безопасность аккаунта</span>
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

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Настройки системы</span>
                </CardTitle>
                <CardDescription>
                  Основные параметры платформы и функциональность
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Название платформы</Label>
                    <Input 
                      id="siteName"
                      value={systemSettings.siteName}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      data-testid="input-site-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timezone: value }))}>
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
                    <Label htmlFor="defaultSessionDuration">Длительность сессии по умолчанию (мин)</Label>
                    <Input 
                      id="defaultSessionDuration"
                      type="number"
                      value={systemSettings.defaultSessionDuration}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultSessionDuration: e.target.value }))}
                      data-testid="input-default-session-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSessionDuration">Максимальная длительность сессии (мин)</Label>
                    <Input 
                      id="maxSessionDuration"
                      type="number"
                      value={systemSettings.maxSessionDuration}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxSessionDuration: e.target.value }))}
                      data-testid="input-max-session-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsersPerTherapist">Максимум пациентов на терапевта</Label>
                    <Input 
                      id="maxUsersPerTherapist"
                      type="number"
                      value={systemSettings.maxUsersPerTherapist}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxUsersPerTherapist: e.target.value }))}
                      data-testid="input-max-users-per-therapist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionPeriod">Период хранения данных</Label>
                    <Select value={systemSettings.dataRetentionPeriod} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, dataRetentionPeriod: value }))}>
                      <SelectTrigger data-testid="select-data-retention">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">1 год</SelectItem>
                        <SelectItem value="2years">2 года</SelectItem>
                        <SelectItem value="5years">5 лет</SelectItem>
                        <SelectItem value="permanent">Постоянно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Описание платформы</Label>
                  <Textarea 
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    data-testid="textarea-site-description"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Режим обслуживания</p>
                      <p className="text-xs text-muted-foreground">Отключает доступ для всех пользователей</p>
                    </div>
                    <Switch 
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                      data-testid="switch-maintenance-mode"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Регистрация новых пользователей</p>
                      <p className="text-xs text-muted-foreground">Разрешить регистрацию на платформе</p>
                    </div>
                    <Switch 
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))}
                      data-testid="switch-registration-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Подтверждение email</p>
                      <p className="text-xs text-muted-foreground">Требовать подтверждение email при регистрации</p>
                    </div>
                    <Switch 
                      checked={systemSettings.emailVerificationRequired}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))}
                      data-testid="switch-email-verification"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Запись сессий</p>
                      <p className="text-xs text-muted-foreground">Разрешить запись EMDR сессий</p>
                    </div>
                    <Switch 
                      checked={systemSettings.sessionRecordingEnabled}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, sessionRecordingEnabled: checked }))}
                      data-testid="switch-session-recording"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Управление пользователями</span>
                </CardTitle>
                <CardDescription>
                  Настройки для управления пользователями и их правами
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFreeTrialDays">Пробный период (дней)</Label>
                    <Input 
                      id="maxFreeTrialDays"
                      type="number"
                      value={userManagement.maxFreeTrialDays}
                      onChange={(e) => setUserManagement(prev => ({ ...prev, maxFreeTrialDays: e.target.value }))}
                      data-testid="input-trial-days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inactiveUserCleanup">Очистка неактивных пользователей (дней)</Label>
                    <Input 
                      id="inactiveUserCleanup"
                      type="number"
                      value={userManagement.inactiveUserCleanup}
                      onChange={(e) => setUserManagement(prev => ({ ...prev, inactiveUserCleanup: e.target.value }))}
                      data-testid="input-inactive-cleanup"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Автоподтверждение психологов</p>
                      <p className="text-xs text-muted-foreground">Автоматически одобрять новых психологов</p>
                    </div>
                    <Switch 
                      checked={userManagement.autoApproveTherapists}
                      onCheckedChange={(checked) => setUserManagement(prev => ({ ...prev, autoApproveTherapists: checked }))}
                      data-testid="switch-auto-approve"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Проверка лицензий</p>
                      <p className="text-xs text-muted-foreground">Требовать подтверждение лицензии психолога</p>
                    </div>
                    <Switch 
                      checked={userManagement.requireLicenseVerification}
                      onCheckedChange={(checked) => setUserManagement(prev => ({ ...prev, requireLicenseVerification: checked }))}
                      data-testid="switch-license-verification"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Гостевые сессии</p>
                      <p className="text-xs text-muted-foreground">Разрешить незарегистрированным пользователям пробные сессии</p>
                    </div>
                    <Switch 
                      checked={userManagement.allowGuestSessions}
                      onCheckedChange={(checked) => setUserManagement(prev => ({ ...prev, allowGuestSessions: checked }))}
                      data-testid="switch-guest-sessions"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Массовые операции</p>
                      <p className="text-xs text-muted-foreground">Разрешить операции с несколькими пользователями</p>
                    </div>
                    <Switch 
                      checked={userManagement.bulkOperationsEnabled}
                      onCheckedChange={(checked) => setUserManagement(prev => ({ ...prev, bulkOperationsEnabled: checked }))}
                      data-testid="switch-bulk-operations"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Безопасность платформы</span>
                </CardTitle>
                <CardDescription>
                  Настройки безопасности, аутентификации и защиты данных
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Минимальная длина пароля</Label>
                    <Input 
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: e.target.value }))}
                      data-testid="input-password-length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Таймаут сессии (мин)</Label>
                    <Input 
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Максимум попыток входа</Label>
                    <Input 
                      id="maxLoginAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                      data-testid="input-max-login-attempts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="encryptionLevel">Уровень шифрования</Label>
                    <Select value={securitySettings.encryptionLevel} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, encryptionLevel: value }))}>
                      <SelectTrigger data-testid="select-encryption">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AES128">AES-128</SelectItem>
                        <SelectItem value="AES256">AES-256</SelectItem>
                        <SelectItem value="RSA2048">RSA-2048</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP адреса администраторов (через запятую)</Label>
                  <Textarea 
                    id="ipWhitelist"
                    placeholder="192.168.1.1, 10.0.0.1, ..."
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                    data-testid="textarea-ip-whitelist"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Двухфакторная аутентификация</p>
                      <p className="text-xs text-muted-foreground">Обязательная 2FA для всех администраторов</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorRequired}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorRequired: checked }))}
                      data-testid="switch-two-factor"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Специальные символы в пароле</p>
                      <p className="text-xs text-muted-foreground">Требовать специальные символы в паролях</p>
                    </div>
                    <Switch 
                      checked={securitySettings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireSpecialChars: checked }))}
                      data-testid="switch-special-chars"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Аудит действий</p>
                      <p className="text-xs text-muted-foreground">Логировать все действия пользователей</p>
                    </div>
                    <Switch 
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, auditLogging: checked }))}
                      data-testid="switch-audit-logging"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Уведомления о безопасности</p>
                      <p className="text-xs text-muted-foreground">Мгновенные уведомления о подозрительной активности</p>
                    </div>
                    <Switch 
                      checked={securitySettings.securityAlerts}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, securityAlerts: checked }))}
                      data-testid="switch-security-alerts"
                    />
                  </div>
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
                  <span>Уведомления администратора</span>
                </CardTitle>
                <CardDescription>
                  Настройка уведомлений о состоянии системы и активности пользователей
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Системные оповещения</p>
                      <p className="text-xs text-muted-foreground">Критические ошибки и проблемы производительности</p>
                    </div>
                    <Switch 
                      checked={notifications.systemAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemAlerts: checked }))}
                      data-testid="switch-system-alerts"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Регистрации пользователей</p>
                      <p className="text-xs text-muted-foreground">Новые пользователи и заявки психологов</p>
                    </div>
                    <Switch 
                      checked={notifications.userRegistrations}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, userRegistrations: checked }))}
                      data-testid="switch-user-registrations"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Проблемы с платежами</p>
                      <p className="text-xs text-muted-foreground">Неудачные транзакции и споры</p>
                    </div>
                    <Switch 
                      checked={notifications.paymentIssues}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentIssues: checked }))}
                      data-testid="switch-payment-issues"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">События безопасности</p>
                      <p className="text-xs text-muted-foreground">Подозрительная активность и нарушения</p>
                    </div>
                    <Switch 
                      checked={notifications.securityEvents}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, securityEvents: checked }))}
                      data-testid="switch-security-events"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Статус резервного копирования</p>
                      <p className="text-xs text-muted-foreground">Успешность и ошибки резервного копирования</p>
                    </div>
                    <Switch 
                      checked={notifications.backupStatus}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, backupStatus: checked }))}
                      data-testid="switch-backup-status"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Оповещения о производительности</p>
                      <p className="text-xs text-muted-foreground">Высокая нагрузка и медленные ответы</p>
                    </div>
                    <Switch 
                      checked={notifications.performanceAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, performanceAlerts: checked }))}
                      data-testid="switch-performance-alerts"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Каналы доставки</h4>
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
                        <p className="text-sm font-medium flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Slack интеграция
                        </p>
                        <p className="text-xs text-muted-foreground">В канал #system-alerts</p>
                      </div>
                      <Switch 
                        checked={notifications.slackIntegration}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, slackIntegration: checked }))}
                        data-testid="switch-slack-integration"
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
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}