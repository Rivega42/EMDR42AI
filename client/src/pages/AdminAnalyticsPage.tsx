import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar,
  Activity,
  Server,
  Database,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  Heart,
  UserCheck,
  Settings,
  Eye,
  FileText
} from "lucide-react";

interface SystemMetrics {
  totalUsers: number;
  activeTherapists: number;
  activePatients: number;
  totalSessions: number;
  successRate: number;
  monthlyRevenue: number;
  serverUptime: number;
  avgResponseTime: number;
  storageUsed: number;
  systemLoad: number;
}

interface PlatformTrend {
  period: string;
  users: number;
  sessions: number;
  revenue: number;
  satisfaction: number;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [metricType, setMetricType] = useState<string>("overview");

  // Mock system metrics
  const systemMetrics: SystemMetrics = {
    totalUsers: 1247,
    activeTherapists: 23,
    activePatients: 156,
    totalSessions: 892,
    successRate: 87,
    monthlyRevenue: 45600,
    serverUptime: 99.9,
    avgResponseTime: 120,
    storageUsed: 68,
    systemLoad: 34
  };

  // Mock trend data
  const platformTrends: PlatformTrend[] = [
    { period: "Январь", users: 1100, sessions: 750, revenue: 38000, satisfaction: 89 },
    { period: "Февраль", users: 1150, sessions: 820, revenue: 41000, satisfaction: 88 },
    { period: "Март", users: 1200, sessions: 850, revenue: 43000, satisfaction: 90 },
    { period: "Апрель", users: 1247, sessions: 892, revenue: 45600, satisfaction: 87 }
  ];

  // Mock therapist performance data
  const therapistMetrics = [
    { name: "Др. Петров Дмитрий", patients: 12, sessions: 45, satisfaction: 4.9, efficiency: 92 },
    { name: "Др. Иванова Елена", patients: 8, sessions: 32, satisfaction: 4.8, efficiency: 88 },
    { name: "Др. Смирнова Анна", patients: 15, sessions: 58, satisfaction: 4.7, efficiency: 90 },
    { name: "Др. Козлов Андрей", patients: 5, sessions: 18, satisfaction: 4.6, efficiency: 85 }
  ];

  // Mock system alerts
  const systemAlerts = [
    { id: 1, type: "warning", message: "Email сервис испытывает задержки", time: "15 мин назад" },
    { id: 2, type: "info", message: "Запланировано обновление базы данных", time: "2 часа назад" },
    { id: 3, type: "success", message: "Резервное копирование завершено успешно", time: "6 часов назад" }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Административная аналитика</h1>
                <p className="text-muted-foreground">Системные метрики, отчёты и аналитика платформы</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-export-analytics">
                <Download className="w-4 h-4 mr-2" />
                Экспорт отчётов
              </Button>
              <Button variant="outline" data-testid="button-analytics-settings">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range and Metric Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Фильтры и настройки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48" data-testid="select-time-range">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Последние 7 дней</SelectItem>
                  <SelectItem value="30d">Последние 30 дней</SelectItem>
                  <SelectItem value="90d">Последние 3 месяца</SelectItem>
                  <SelectItem value="1y">Последний год</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger className="w-48" data-testid="select-metric-type">
                  <SelectValue placeholder="Тип метрик" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Обзор</SelectItem>
                  <SelectItem value="users">Пользователи</SelectItem>
                  <SelectItem value="sessions">Сессии</SelectItem>
                  <SelectItem value="finance">Финансы</SelectItem>
                  <SelectItem value="system">Система</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8" data-testid="analytics-metrics">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{systemMetrics.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Всего пользователей</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">+12%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{systemMetrics.totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Всего сессий</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">+8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                  <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{systemMetrics.successRate}%</p>
                  <p className="text-sm text-muted-foreground">Успешность</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">+2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
                  <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">₽{systemMetrics.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Доход в месяц</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">+15%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                  <Server className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{systemMetrics.serverUptime}%</p>
                  <p className="text-sm text-muted-foreground">Аптайм сервера</p>
                  <div className="flex items-center mt-1">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">Стабильно</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
                  <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{systemMetrics.avgResponseTime}ms</p>
                  <p className="text-sm text-muted-foreground">Время отклика</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    <span className="text-xs text-red-600">+5ms</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-analytics-overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-analytics-performance">
              <BarChart3 className="w-4 h-4 mr-2" />
              Производительность
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-analytics-users">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-analytics-system">
              <Server className="w-4 h-4 mr-2" />
              Система
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Тренды платформы</CardTitle>
                  <CardDescription>Динамика ключевых показателей за период</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="platform-trends">
                    {platformTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium">{trend.period}</p>
                          <p className="text-sm text-muted-foreground">{trend.users} пользователей</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₽{trend.revenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{trend.sessions} сессий</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Системные уведомления</CardTitle>
                  <CardDescription>Последние события и предупреждения</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="system-alerts">
                    {systemAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                        <Badge className={getAlertColor(alert.type)}>
                          {alert.type === 'warning' ? 'Внимание' : alert.type === 'success' ? 'Успех' : 'Инфо'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-alerts">
                    Посмотреть все уведомления
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Производительность терапевтов</CardTitle>
                <CardDescription>Анализ эффективности работы терапевтов</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="therapist-performance">
                  {therapistMetrics.map((therapist, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex-1">
                        <h3 className="font-medium">{therapist.name}</h3>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{therapist.patients} пациентов</span>
                          <span>{therapist.sessions} сессий</span>
                          <span>★ {therapist.satisfaction}</span>
                        </div>
                      </div>
                      <div className="space-y-2 w-32">
                        <div className="flex justify-between text-sm">
                          <span>Эффективность</span>
                          <span>{therapist.efficiency}%</span>
                        </div>
                        <Progress value={therapist.efficiency} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Активность пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="user-activity">
                    <div className="flex justify-between items-center">
                      <span>Активные терапевты</span>
                      <Badge>{systemMetrics.activeTherapists}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Активные пациенты</span>
                      <Badge>{systemMetrics.activePatients}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Сессий сегодня</span>
                      <Badge>24</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Новые регистрации</span>
                      <Badge>12</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>География пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="user-geography">
                    <div className="flex justify-between items-center">
                      <span>Москва</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={45} className="w-20 h-2" />
                        <span className="text-sm">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Санкт-Петербург</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={25} className="w-20 h-2" />
                        <span className="text-sm">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Другие города</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={30} className="w-20 h-2" />
                        <span className="text-sm">30%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Системные ресурсы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="system-resources">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Использование диска</span>
                        <span>{systemMetrics.storageUsed}%</span>
                      </div>
                      <Progress value={systemMetrics.storageUsed} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Загрузка системы</span>
                        <span>{systemMetrics.systemLoad}%</span>
                      </div>
                      <Progress value={systemMetrics.systemLoad} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Аптайм сервера</span>
                        <span>{systemMetrics.serverUptime}%</span>
                      </div>
                      <Progress value={systemMetrics.serverUptime} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Состояние сервисов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="service-status">
                    <div className="flex items-center justify-between">
                      <span>База данных</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Работает</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API сервер</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Работает</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Видеосвязь</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Работает</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email сервис</span>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600">Задержки</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}