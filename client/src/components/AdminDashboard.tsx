import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  FileText, 
  TrendingUp, 
  Heart, 
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  Database,
  Mail,
  Search,
  Filter
} from "lucide-react";

interface Therapist {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'pending' | 'suspended';
  specialization: string;
  patients: number;
  rating: number;
  joinDate: string;
  lastActive: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'completed';
  therapist: string;
  progress: number;
  joinDate: string;
  lastSession: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeTherapists: number;
  activePatients: number;
  totalSessions: number;
  successRate: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'therapists' | 'patients' | 'sessions' | 'system'>('overview');
  const [searchTerm, setSearchTerm] = useState("");
  
  //todo: remove mock functionality
  const mockMetrics: SystemMetrics = {
    totalUsers: 1247,
    activeTherapists: 23,
    activePatients: 156,
    totalSessions: 892,
    successRate: 87,
    monthlyRevenue: 45600
  };
  
  const mockTherapists: Therapist[] = [
    {
      id: "1",
      name: "Др. Петров Дмитрий",
      email: "petrov@emdr-platform.com",
      avatar: undefined,
      status: "active",
      specialization: "EMDR, Травматерапия",
      patients: 12,
      rating: 4.9,
      joinDate: "2024-01-15",
      lastActive: "Сегодня в 14:30"
    },
    {
      id: "2",
      name: "Др. Иванова Елена",
      email: "ivanova@emdr-platform.com",
      avatar: undefined,
      status: "active",
      specialization: "EMDR, Тревожные расстройства",
      patients: 8,
      rating: 4.8,
      joinDate: "2024-02-20",
      lastActive: "Вчера в 16:45"
    },
    {
      id: "3",
      name: "Др. Козлов Андрей",
      email: "kozlov@emdr-platform.com",
      avatar: undefined,
      status: "pending",
      specialization: "EMDR, Депрессия",
      patients: 0,
      rating: 0,
      joinDate: "2024-12-10",
      lastActive: "Никогда"
    }
  ];
  
  const mockPatients: Patient[] = [
    {
      id: "1",
      name: "Анна Иванова",
      email: "anna@example.com",
      avatar: undefined,
      status: "active",
      therapist: "Др. Петров Дмитрий",
      progress: 58,
      joinDate: "2024-10-15",
      lastSession: "2024-12-12"
    },
    {
      id: "2",
      name: "Михаил Петров",
      email: "mikhail@example.com",
      avatar: undefined,
      status: "active",
      therapist: "Др. Петров Дмитрий",
      progress: 33,
      joinDate: "2024-11-01",
      lastSession: "2024-12-10"
    },
    {
      id: "3",
      name: "Елена Сидорова",
      email: "elena@example.com",
      avatar: undefined,
      status: "completed",
      therapist: "Др. Иванова Елена",
      progress: 100,
      joinDate: "2024-08-20",
      lastSession: "2024-12-05"
    }
  ];

  const getTherapistStatusColor = (status: Therapist['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getTherapistStatusLabel = (status: Therapist['status']) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'pending': return 'Ожидает';
      case 'suspended': return 'Заблокирован';
    }
  };

  const getPatientStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getPatientStatusLabel = (status: Patient['status']) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'completed': return 'Завершён';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Панель администратора</h1>
                <p className="text-muted-foreground">Управление платформой EMDR терапии</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-export-data">
                <Database className="w-4 h-4 mr-2" />
                Экспорт данных
              </Button>
              <Button variant="outline" data-testid="button-admin-settings">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Обзор', icon: TrendingUp },
              { key: 'therapists', label: 'Терапевты', icon: UserCheck },
              { key: 'patients', label: 'Пациенты', icon: Users },
              { key: 'sessions', label: 'Сессии', icon: Calendar },
              { key: 'system', label: 'Система', icon: Settings }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockMetrics.totalUsers}</p>
                        <p className="text-sm text-muted-foreground">Всего пользователей</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                        <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockMetrics.activeTherapists}</p>
                        <p className="text-sm text-muted-foreground">Активных терапевтов</p>
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
                        <p className="text-2xl font-bold text-card-foreground">{mockMetrics.activePatients}</p>
                        <p className="text-sm text-muted-foreground">Активных пациентов</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                        <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockMetrics.totalSessions}</p>
                        <p className="text-sm text-muted-foreground">Всего сессий</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockMetrics.successRate}%</p>
                        <p className="text-sm text-muted-foreground">Успешность</p>
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
                        <p className="text-2xl font-bold text-card-foreground">₽{mockMetrics.monthlyRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Доход в месяц</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Недавняя активность</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Др. Петров Дмитрий завершил сессию с Анной Ивановой</span>
                      <span className="text-muted-foreground ml-auto">15 минут назад</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Новый терапевт Др. Козлов Андрей зарегистрирован</span>
                      <span className="text-muted-foreground ml-auto">2 часа назад</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>Пациент Михаил Петров пропустил сессию</span>
                      <span className="text-muted-foreground ml-auto">3 часа назад</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>Отправлено 15 уведомлений о предстоящих сессиях</span>
                      <span className="text-muted-foreground ml-auto">1 день назад</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Therapists */}
              <Card>
                <CardHeader>
                  <CardTitle>Лучшие терапевты</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTherapists.filter(t => t.status === 'active').slice(0, 3).map((therapist, index) => (
                      <div key={therapist.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={therapist.avatar} />
                            <AvatarFallback className="bg-primary/10">
                              {therapist.name.split(' ')[1]?.charAt(0) || 'Т'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-card-foreground">{therapist.name}</p>
                            <p className="text-sm text-muted-foreground">{therapist.patients} пациентов • ★ {therapist.rating}</p>
                          </div>
                        </div>
                        <Badge className={getTherapistStatusColor(therapist.status)}>
                          {getTherapistStatusLabel(therapist.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Быстрые действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" data-testid="button-approve-therapist">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Одобрить терапевтов ({mockTherapists.filter(t => t.status === 'pending').length})
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-send-notifications">
                    <Mail className="w-4 h-4 mr-2" />
                    Отправить уведомления
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-generate-reports">
                    <FileText className="w-4 h-4 mr-2" />
                    Генерация отчётов
                  </Button>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Состояние системы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Сервер</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Работает</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">База данных</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Работает</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Видеосвязь</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Работает</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email сервис</span>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-600">Задержки</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика платформы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Завершённые курсы</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Удовлетворённость</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Повторные клиенты</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'therapists' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-card-foreground">Управление терапевтами</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск терапевтов..." 
                    className="pl-9 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-therapists"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter-therapists">
                  <Filter className="w-4 h-4 mr-2" />
                  Фильтр
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockTherapists.map((therapist) => (
                <Card key={therapist.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={therapist.avatar} />
                          <AvatarFallback className="bg-primary/10">
                            {therapist.name.split(' ')[1]?.charAt(0) || 'Т'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{therapist.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{therapist.email}</p>
                        </div>
                      </div>
                      <Badge className={getTherapistStatusColor(therapist.status)}>
                        {getTherapistStatusLabel(therapist.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Специализация:</span> {therapist.specialization}</p>
                      <p><span className="font-medium">Пациентов:</span> {therapist.patients}</p>
                      {therapist.rating > 0 && <p><span className="font-medium">Рейтинг:</span> ★ {therapist.rating}</p>}
                      <p><span className="font-medium">Дата регистрации:</span> {new Date(therapist.joinDate).toLocaleDateString('ru-RU')}</p>
                      <p><span className="font-medium">Последняя активность:</span> {therapist.lastActive}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-therapist-${therapist.id}`}>
                        <FileText className="w-4 h-4 mr-1" />
                        Профиль
                      </Button>
                      {therapist.status === 'pending' && (
                        <Button size="sm" className="flex-1" data-testid={`button-approve-therapist-${therapist.id}`}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Одобрить
                        </Button>
                      )}
                      {therapist.status === 'active' && (
                        <Button size="sm" variant="destructive" data-testid={`button-suspend-therapist-${therapist.id}`}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Заблокировать
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-card-foreground">Управление пациентами</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск пациентов..." 
                    className="pl-9 w-64"
                    data-testid="input-search-patients"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter-patients">
                  <Filter className="w-4 h-4 mr-2" />
                  Фильтр
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {mockPatients.map((patient, index) => (
                    <div key={patient.id} className={`flex items-center justify-between p-6 hover-elevate ${
                      index < mockPatients.length - 1 ? 'border-b border-border' : ''
                    }`}>
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback className="bg-primary/10">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-card-foreground truncate">{patient.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Терапевт: {patient.therapist}</span>
                            <span>Прогресс: {patient.progress}%</span>
                            <span>Последняя сессия: {new Date(patient.lastSession).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24">
                          <Progress value={patient.progress} className="h-2" />
                        </div>
                        <Badge className={getPatientStatusColor(patient.status)}>
                          {getPatientStatusLabel(patient.status)}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`button-view-patient-${patient.id}`}>
                          <FileText className="w-4 h-4 mr-1" />
                          Профиль
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Мониторинг сессий</CardTitle>
                <CardDescription>Отслеживание всех терапевтических сессий на платформе</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Управление сессиями</h3>
                  <p className="text-muted-foreground mb-6">
                    Здесь будет отображаться детальная информация о всех сессиях, 
                    включая статистику проведения, отмены и эффективность.
                  </p>
                  <Button data-testid="button-view-all-sessions">
                    Просмотреть все сессии
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Системные настройки</CardTitle>
                <CardDescription>Конфигурация и управление платформой</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Настройки системы</h3>
                  <p className="text-muted-foreground mb-6">
                    Конфигурация безопасности, уведомлений, интеграций и других 
                    системных параметров платформы.
                  </p>
                  <Button data-testid="button-open-settings">
                    Открыть настройки
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}