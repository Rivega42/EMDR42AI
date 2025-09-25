import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Database, 
  Shield, 
  Settings,
  Save, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
  Lock,
  Mail,
  Bell,
  Users,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Archive,
  RefreshCw
} from "lucide-react";

export default function AdminSystemPage() {
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

  // Mock system status
  const systemStatus = {
    server: { status: 'healthy', uptime: '99.9%', lastRestart: '7 дней назад' },
    database: { status: 'healthy', size: '2.4GB', connections: 45 },
    storage: { status: 'warning', used: '68%', free: '1.2TB' },
    network: { status: 'healthy', bandwidth: '1Gbps', latency: '12ms' },
    backup: { status: 'healthy', lastBackup: '2 часа назад', size: '1.8GB' }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Системные настройки</h1>
                <p className="text-muted-foreground">Управление конфигурацией и параметрами системы</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-backup-system">
                <Archive className="w-4 h-4 mr-2" />
                Создать резервную копию
              </Button>
              <Button data-testid="button-save-settings">
                <Save className="w-4 h-4 mr-2" />
                Сохранить изменения
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Статус системы</span>
            </CardTitle>
            <CardDescription>Текущее состояние всех компонентов системы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="system-status">
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                <Server className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.server.status)}
                    <span className="font-medium">Сервер</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Аптайм: {systemStatus.server.uptime}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                <Database className="w-8 h-8 text-green-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.database.status)}
                    <span className="font-medium">База данных</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Размер: {systemStatus.database.size}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                <HardDrive className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.storage.status)}
                    <span className="font-medium">Хранилище</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Занято: {systemStatus.storage.used}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                <Network className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.network.status)}
                    <span className="font-medium">Сеть</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Задержка: {systemStatus.network.latency}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                <Archive className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus.backup.status)}
                    <span className="font-medium">Резервные копии</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Последний: {systemStatus.backup.lastBackup}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different system settings */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" data-testid="tab-system-general">
              <Settings className="w-4 h-4 mr-2" />
              Общие
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-system-security">
              <Shield className="w-4 h-4 mr-2" />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-system-users">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-system-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-system-maintenance">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обслуживание
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Основные настройки платформы</span>
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

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Настройки безопасности</span>
                </CardTitle>
                <CardDescription>
                  Конфигурация безопасности и аутентификации
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
                      data-testid="input-password-min-length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Таймаут сессии (минуты)</Label>
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
                      <SelectTrigger data-testid="select-encryption-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AES128">AES-128</SelectItem>
                        <SelectItem value="AES256">AES-256</SelectItem>
                        <SelectItem value="AES512">AES-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP белый список</Label>
                  <Textarea 
                    id="ipWhitelist"
                    placeholder="192.168.1.1, 10.0.0.1/24"
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
                      <p className="text-xs text-muted-foreground">Обязательная 2FA для всех пользователей</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorRequired}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorRequired: checked }))}
                      data-testid="switch-two-factor-required"
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
                      data-testid="switch-password-special-chars"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Аудит логирование</p>
                      <p className="text-xs text-muted-foreground">Записывать все действия пользователей</p>
                    </div>
                    <Switch 
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, auditLogging: checked }))}
                      data-testid="switch-audit-logging"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Оповещения безопасности</p>
                      <p className="text-xs text-muted-foreground">Уведомления о подозрительной активности</p>
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
                      <p className="text-xs text-muted-foreground">Разрешить администраторам массовые операции</p>
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Настройки уведомлений</span>
                </CardTitle>
                <CardDescription>
                  Конфигурация системных уведомлений и оповещений
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Системные оповещения</p>
                      <p className="text-xs text-muted-foreground">Уведомления о работе системы</p>
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
                      <p className="text-xs text-muted-foreground">Уведомления о новых регистрациях</p>
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
                      <p className="text-xs text-muted-foreground">Уведомления об ошибках платежей</p>
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
                      <p className="text-xs text-muted-foreground">Уведомления о нарушениях безопасности</p>
                    </div>
                    <Switch 
                      checked={notifications.securityEvents}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, securityEvents: checked }))}
                      data-testid="switch-security-events"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Статус резервных копий</p>
                      <p className="text-xs text-muted-foreground">Уведомления о создании бэкапов</p>
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
                      <p className="text-xs text-muted-foreground">Уведомления о проблемах производительности</p>
                    </div>
                    <Switch 
                      checked={notifications.performanceAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, performanceAlerts: checked }))}
                      data-testid="switch-performance-alerts"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Email уведомления</p>
                      <p className="text-xs text-muted-foreground">Отправлять уведомления по email</p>
                    </div>
                    <Switch 
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">SMS уведомления</p>
                      <p className="text-xs text-muted-foreground">Отправлять критические уведомления по SMS</p>
                    </div>
                    <Switch 
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsNotifications: checked }))}
                      data-testid="switch-sms-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Интеграция со Slack</p>
                      <p className="text-xs text-muted-foreground">Отправлять уведомления в Slack канал</p>
                    </div>
                    <Switch 
                      checked={notifications.slackIntegration}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, slackIntegration: checked }))}
                      data-testid="switch-slack-integration"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Обслуживание системы</span>
                </CardTitle>
                <CardDescription>
                  Инструменты для обслуживания и диагностики системы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Резервное копирование</h3>
                    <div className="space-y-2">
                      <Label>Частота резервного копирования</Label>
                      <Select value={systemSettings.backupFrequency} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, backupFrequency: value }))}>
                        <SelectTrigger data-testid="select-backup-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Каждый час</SelectItem>
                          <SelectItem value="daily">Ежедневно</SelectItem>
                          <SelectItem value="weekly">Еженедельно</SelectItem>
                          <SelectItem value="monthly">Ежемесячно</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full" data-testid="button-create-backup">
                        <Archive className="w-4 h-4 mr-2" />
                        Создать резервную копию сейчас
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-restore-backup">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Восстановить из резервной копии
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Системная диагностика</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" data-testid="button-system-check">
                        <Activity className="w-4 h-4 mr-2" />
                        Проверка системы
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-clear-cache">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Очистить кэш
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-optimize-database">
                        <Database className="w-4 h-4 mr-2" />
                        Оптимизировать базу данных
                      </Button>
                      <Button variant="destructive" className="w-full" data-testid="button-restart-system">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Перезапустить систему
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Информация о системе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><span className="font-medium">Версия платформы:</span> 2.1.4</p>
                      <p><span className="font-medium">Последнее обновление:</span> 15 декабря 2024</p>
                      <p><span className="font-medium">Время работы:</span> 7 дней, 14 часов</p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-medium">Размер базы данных:</span> {systemStatus.database.size}</p>
                      <p><span className="font-medium">Активные подключения:</span> {systemStatus.database.connections}</p>
                      <p><span className="font-medium">Последний бэкап:</span> {systemStatus.backup.lastBackup}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}