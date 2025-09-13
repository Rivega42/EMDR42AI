import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  Video, 
  FileText, 
  Users, 
  TrendingUp, 
  Heart, 
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Star,
  Plus,
  Send,
  Copy,
  Link2
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  totalSessions: number;
  completedSessions: number;
  nextSession?: string;
}

interface Session {
  id: string;
  date: string;
  time: string;
  patient: {
    name: string;
    avatar?: string;
  };
  status: 'upcoming' | 'completed' | 'cancelled' | 'ongoing';
  duration: number;
  sessionType: 'assessment' | 'therapy' | 'follow-up';
}

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'sessions' | 'invitations'>('overview');
  const [invitationLink, setInvitationLink] = useState("");
  
  //todo: remove mock functionality
  const mockTherapist = {
    name: "Др. Петров Дмитрий",
    email: "petrov@emdr-platform.com",
    title: "Сертифицированный EMDR терапевт",
    experience: "8 лет опыта",
    rating: 4.9,
    avatar: undefined
  };
  
  const mockPatients: Patient[] = [
    {
      id: "1",
      name: "Анна Иванова",
      email: "anna@example.com",
      avatar: undefined,
      status: "active",
      progress: 58,
      totalSessions: 12,
      completedSessions: 7,
      nextSession: "2024-12-16T14:00"
    },
    {
      id: "2",
      name: "Михаил Петров",
      email: "mikhail@example.com",
      avatar: undefined,
      status: "active", 
      progress: 33,
      totalSessions: 12,
      completedSessions: 4,
      nextSession: "2024-12-17T15:30"
    },
    {
      id: "3",
      name: "Елена Сидорова",
      email: "elena@example.com",
      avatar: undefined,
      status: "completed",
      progress: 100,
      totalSessions: 12,
      completedSessions: 12
    }
  ];
  
  const mockSessions: Session[] = [
    {
      id: "1",
      date: "2024-12-16",
      time: "14:00",
      patient: { name: "Анна Иванова", avatar: undefined },
      status: "upcoming",
      duration: 60,
      sessionType: "therapy"
    },
    {
      id: "2",
      date: "2024-12-16",
      time: "15:30",
      patient: { name: "Михаил Петров", avatar: undefined },
      status: "upcoming",
      duration: 60,
      sessionType: "assessment"
    },
    {
      id: "3",
      date: "2024-12-15",
      time: "14:00",
      patient: { name: "Анна Иванова", avatar: undefined },
      status: "completed",
      duration: 60,
      sessionType: "therapy"
    }
  ];

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusLabel = (status: Patient['status']) => {
    switch (status) {
      case 'active': return 'Активный';
      case 'completed': return 'Завершён';
      case 'paused': return 'Приостановлен';
    }
  };

  const getSessionTypeLabel = (type: Session['sessionType']) => {
    switch (type) {
      case 'assessment': return 'Диагностика';
      case 'therapy': return 'Терапия';
      case 'follow-up': return 'Контроль';
    }
  };

  const getSessionStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getSessionStatusLabel = (status: Session['status']) => {
    switch (status) {
      case 'upcoming': return 'Ожидается';
      case 'ongoing': return 'В процессе';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
    }
  };

  const generateInvitationLink = () => {
    const inviteId = Math.random().toString(36).substr(2, 8);
    const link = `https://emdr-platform.com/invite/${inviteId}`;
    setInvitationLink(link);
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={mockTherapist.avatar} alt={mockTherapist.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {mockTherapist.name.split(' ')[1]?.charAt(0) || 'Д'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Панель терапевта</h1>
                <p className="text-muted-foreground">{mockTherapist.title} • {mockTherapist.experience}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{mockTherapist.rating} рейтинг</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Расписание
              </Button>
              <Button size="lg" className="bg-primary" data-testid="button-start-session">
                <Video className="w-5 h-5 mr-2" />
                Начать сессию
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
              { key: 'patients', label: 'Пациенты', icon: Users },
              { key: 'sessions', label: 'Сессии', icon: Calendar },
              { key: 'invitations', label: 'Приглашения', icon: Send }
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
            {/* Main Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockPatients.length}</p>
                        <p className="text-sm text-muted-foreground">Пациентов</p>
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
                        <p className="text-2xl font-bold text-card-foreground">{mockSessions.filter(s => s.status === 'upcoming').length}</p>
                        <p className="text-sm text-muted-foreground">Сегодня</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">85%</p>
                        <p className="text-sm text-muted-foreground">Эффективность</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                        <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockTherapist.rating}</p>
                        <p className="text-sm text-muted-foreground">Рейтинг</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Сегодняшние сессии</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSessions.filter(s => s.status === 'upcoming').map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={session.patient.avatar} />
                            <AvatarFallback className="bg-primary/10">
                              {session.patient.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-card-foreground">{session.patient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.time} • {session.duration} мин • {getSessionTypeLabel(session.sessionType)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSessionStatusColor(session.status)}>
                            {getSessionStatusLabel(session.status)}
                          </Badge>
                          <Button size="sm" data-testid={`button-start-session-${session.id}`}>
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Начать
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Недавняя активность</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Завершена сессия с Анной Ивановой</span>
                      <span className="text-muted-foreground ml-auto">15 минут назад</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span>Новый запрос на консультацию</span>
                      <span className="text-muted-foreground ml-auto">1 час назад</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Отчёт по прогрессу Михаила Петрова</span>
                      <span className="text-muted-foreground ml-auto">2 часа назад</span>
                    </div>
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
                  <Button className="w-full justify-start" data-testid="button-new-patient">
                    <Plus className="w-4 h-4 mr-2" />
                    Новый пациент
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-schedule-session">
                    <Calendar className="w-4 h-4 mr-2" />
                    Запланировать сессию
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-reports">
                    <FileText className="w-4 h-4 mr-2" />
                    Просмотр отчётов
                  </Button>
                </CardContent>
              </Card>

              {/* Patient Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Прогресс пациентов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockPatients.filter(p => p.status === 'active').map((patient) => (
                    <div key={patient.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{patient.name}</span>
                        <span>{patient.progress}%</span>
                      </div>
                      <Progress value={patient.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {patient.completedSessions}/{patient.totalSessions} сессий
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Professional Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Ресурсы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-emdr-protocols">
                      <FileText className="w-4 h-4 mr-2" />
                      Протоколы EMDR
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-assessment-tools">
                      <Heart className="w-4 h-4 mr-2" />
                      Инструменты оценки
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-supervision">
                      <Users className="w-4 h-4 mr-2" />
                      Супервизия
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-card-foreground">Мои пациенты</h2>
              <Button data-testid="button-add-patient">
                <Plus className="w-4 h-4 mr-2" />
                Добавить пациента
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPatients.map((patient) => (
                <Card key={patient.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback className="bg-primary/10">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(patient.status)}>
                        {getStatusLabel(patient.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс</span>
                        <span>{patient.progress}%</span>
                      </div>
                      <Progress value={patient.progress} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Сессий: {patient.completedSessions}/{patient.totalSessions}</p>
                      {patient.nextSession && (
                        <p>Следующая: {new Date(patient.nextSession).toLocaleDateString('ru-RU')}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1" data-testid={`button-view-patient-${patient.id}`}>
                        <FileText className="w-4 h-4 mr-1" />
                        Профиль
                      </Button>
                      {patient.status === 'active' && (
                        <Button size="sm" variant="outline" data-testid={`button-session-patient-${patient.id}`}>
                          <Video className="w-4 h-4 mr-1" />
                          Сессия
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Все сессии</CardTitle>
                <CardDescription>История и расписание сессий EMDR терапии</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 rounded-lg border border-border hover-elevate">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={session.patient.avatar} />
                          <AvatarFallback className="bg-primary/10">
                            {session.patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{session.patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('ru-RU')} в {session.time} • {session.duration} мин
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getSessionTypeLabel(session.sessionType)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getSessionStatusColor(session.status)}>
                          {getSessionStatusLabel(session.status)}
                        </Badge>
                        {session.status === 'upcoming' ? (
                          <Button data-testid={`button-start-${session.id}`}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Начать
                          </Button>
                        ) : (
                          <Button variant="outline" data-testid={`button-review-${session.id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Отчёт
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Создание приглашений</CardTitle>
                <CardDescription>Генерируйте персонализированные ссылки-приглашения для новых пациентов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Имя пациента</label>
                      <Input placeholder="Введите имя пациента" data-testid="input-patient-name" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email пациента</label>
                      <Input type="email" placeholder="patient@example.com" data-testid="input-patient-email" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Персональное сообщение</label>
                      <Textarea 
                        placeholder="Добавьте персональное приветствие или инструкции для пациента..." 
                        className="min-h-[100px]"
                        data-testid="textarea-personal-message"
                      />
                    </div>
                    
                    <Button 
                      onClick={generateInvitationLink} 
                      className="w-full"
                      data-testid="button-generate-invitation"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Создать приглашение
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-muted/50 border-2 border-dashed border-border">
                      <div className="text-center space-y-4">
                        <Heart className="w-12 h-12 mx-auto text-primary" />
                        <div>
                          <h3 className="font-semibold">Богатые ссылки-приглашения</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Создавайте персонализированные приглашения с информацией о терапии, 
                            вашем профиле и процессе лечения. Пациенты получат всю необходимую 
                            информацию перед первой сессией.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {invitationLink && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Ссылка-приглашение готова</label>
                        <div className="flex space-x-2">
                          <Input 
                            value={invitationLink} 
                            readOnly 
                            className="bg-muted"
                            data-testid="input-invitation-link"
                          />
                          <Button 
                            onClick={copyInvitationLink}
                            size="icon"
                            data-testid="button-copy-invitation"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ссылка действительна в течение 7 дней. Отправьте её пациенту по email или мессенджеру.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Invitations */}
            <Card>
              <CardHeader>
                <CardTitle>Последние приглашения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Мария Козлова</p>
                      <p className="text-sm text-muted-foreground">maria@example.com • Создано 2 дня назад</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Принято
                      </Badge>
                      <Button variant="outline" size="sm" data-testid="button-view-invitation-1">
                        Просмотр
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Алексей Смирнов</p>
                      <p className="text-sm text-muted-foreground">alexey@example.com • Создано 5 дней назад</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Ожидает
                      </Badge>
                      <Button variant="outline" size="sm" data-testid="button-resend-invitation-2">
                        Отправить повторно
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}