import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Video, 
  FileText, 
  TrendingUp, 
  Heart, 
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Star
} from "lucide-react";

interface Session {
  id: string;
  date: string;
  time: string;
  therapist: {
    name: string;
    avatar?: string;
  };
  status: 'upcoming' | 'completed' | 'cancelled';
  duration: number;
}

interface Progress {
  totalSessions: number;
  completedSessions: number;
  currentWeek: number;
  overallProgress: number;
}

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'progress'>('overview');
  
  //todo: remove mock functionality
  const mockPatient = {
    name: "Анна Иванова",
    email: "anna@example.com",
    joinedDate: "15 октября 2024",
    avatar: undefined
  };
  
  const mockProgress: Progress = {
    totalSessions: 12,
    completedSessions: 7,
    currentWeek: 3,
    overallProgress: 58
  };
  
  const mockSessions: Session[] = [
    {
      id: "1",
      date: "2024-12-16",
      time: "14:00",
      therapist: { name: "Др. Петров Дмитрий", avatar: undefined },
      status: "upcoming",
      duration: 60
    },
    {
      id: "2", 
      date: "2024-12-12",
      time: "15:30",
      therapist: { name: "Др. Петров Дмитрий", avatar: undefined },
      status: "completed",
      duration: 60
    },
    {
      id: "3",
      date: "2024-12-09",
      time: "14:00", 
      therapist: { name: "Др. Петров Дмитрий", avatar: undefined },
      status: "completed",
      duration: 60
    }
  ];

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusLabel = (status: Session['status']) => {
    switch (status) {
      case 'upcoming': return 'Предстоит';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={mockPatient.avatar} alt={mockPatient.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {mockPatient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Добро пожаловать, {mockPatient.name}!</h1>
                <p className="text-muted-foreground">Ваш путь к выздоровлению • С нами с {mockPatient.joinedDate}</p>
              </div>
            </div>
            <Button size="lg" className="bg-primary" data-testid="button-new-session" onClick={() => window.location.href = '/patient/session'}>
              <Video className="w-5 h-5 mr-2" />
              Начать AI сессию
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Обзор', icon: TrendingUp },
              { key: 'sessions', label: 'Мои сессии', icon: Calendar },
              { key: 'progress', label: 'Прогресс', icon: Heart }
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
            {/* Progress Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockProgress.completedSessions}</p>
                        <p className="text-sm text-muted-foreground">Сессий пройдено</p>
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
                        <p className="text-2xl font-bold text-card-foreground">{mockProgress.overallProgress}%</p>
                        <p className="text-sm text-muted-foreground">Прогресс</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{mockProgress.currentWeek}</p>
                        <p className="text-sm text-muted-foreground">Неделя терапии</p>
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
                        <p className="text-2xl font-bold text-card-foreground">4.9</p>
                        <p className="text-sm text-muted-foreground">Рейтинг</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Недавние сессии</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={session.therapist.avatar} />
                            <AvatarFallback className="bg-primary/10">
                              {session.therapist.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-card-foreground">{session.therapist.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString('ru-RU')} в {session.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusLabel(session.status)}
                          </Badge>
                          {session.status === 'upcoming' && (
                            <Button size="sm" data-testid={`button-join-session-${session.id}`}>
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Присоединиться
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Общий прогресс</CardTitle>
                  <CardDescription>Ваш путь к выздоровлению</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Завершено сессий</span>
                      <span>{mockProgress.completedSessions}/{mockProgress.totalSessions}</span>
                    </div>
                    <Progress value={(mockProgress.completedSessions / mockProgress.totalSessions) * 100} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Начальная оценка завершена</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Первая неделя терапии</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-muted-foreground">Промежуточная оценка</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment */}
              <Card>
                <CardHeader>
                  <CardTitle>Следующая сессия</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10">
                          {mockSessions[0].therapist.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{mockSessions[0].therapist.name}</p>
                        <p className="text-sm text-muted-foreground">Сертифицированный EMDR терапевт</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(mockSessions[0].date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{mockSessions[0].time} ({mockSessions[0].duration} мин)</span>
                      </div>
                    </div>
                    
                    <Button className="w-full" data-testid="button-join-next-session" onClick={() => window.location.href = '/patient/session'}>
                      <Video className="w-4 h-4 mr-2" />
                      Начать AI сессию  
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Полезные материалы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-resources-guides">
                      <FileText className="w-4 h-4 mr-2" />
                      Руководства по EMDR
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-resources-exercises">
                      <Heart className="w-4 h-4 mr-2" />
                      Упражнения для дома
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-resources-support">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Техники релаксации
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>История сессий</CardTitle>
                <CardDescription>Все ваши сессии EMDR терапии</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-6 rounded-lg border border-border hover-elevate">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={session.therapist.avatar} />
                          <AvatarFallback className="bg-primary/10">
                            {session.therapist.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{session.therapist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('ru-RU')} в {session.time} • {session.duration} мин
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusLabel(session.status)}
                        </Badge>
                        {session.status === 'upcoming' ? (
                          <Button data-testid={`button-join-${session.id}`}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Присоединиться
                          </Button>
                        ) : (
                          <Button variant="outline" data-testid={`button-view-${session.id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Отчет
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

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Детальный прогресс</CardTitle>
                <CardDescription>Отслеживание вашего пути к выздоровлению</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Progress visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="mx-auto w-32 h-32 relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--primary))"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${(mockProgress.overallProgress / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-card-foreground">{mockProgress.overallProgress}%</span>
                        </div>
                      </div>
                      <p className="mt-4 font-medium text-card-foreground">Общий прогресс</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="mx-auto w-32 h-32 relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${((mockProgress.completedSessions / mockProgress.totalSessions) * 100 / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-card-foreground">{mockProgress.completedSessions}/{mockProgress.totalSessions}</span>
                        </div>
                      </div>
                      <p className="mt-4 font-medium text-card-foreground">Сессии</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="mx-auto w-32 h-32 relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--chart-3))"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${((mockProgress.currentWeek / 12) * 100 / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-card-foreground">{mockProgress.currentWeek}/12</span>
                        </div>
                      </div>
                      <p className="mt-4 font-medium text-card-foreground">Недели</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ключевые достижения</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Первая сессия завершена</p>
                          <p className="text-sm text-green-600 dark:text-green-400">5 декабря 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Половина пути пройдена</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">12 декабря 2024</p>
                        </div>
                      </div>
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