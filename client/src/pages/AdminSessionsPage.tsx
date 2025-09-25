import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter,
  VideoIcon,
  PlayCircle,
  PauseCircle,
  StopCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Eye,
  Shield
} from "lucide-react";

interface Session {
  id: string;
  therapistName: string;
  therapistAvatar?: string;
  patientName: string;
  patientAvatar?: string;
  status: 'active' | 'completed' | 'cancelled' | 'scheduled';
  startTime: string;
  endTime?: string;
  duration: number;
  type: 'EMDR' | 'Consultation' | 'Follow-up';
  progress?: number;
  notes?: string;
  recordingAvailable: boolean;
}

export default function AdminSessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Mock sessions data
  const mockSessions: Session[] = [
    {
      id: "1",
      therapistName: "Др. Петров Дмитрий",
      patientName: "Анна И.",
      status: "active",
      startTime: "2024-12-25T14:00:00Z",
      duration: 50,
      type: "EMDR",
      progress: 65,
      recordingAvailable: true
    },
    {
      id: "2", 
      therapistName: "Др. Иванова Елена",
      patientName: "Михаил П.",
      status: "completed",
      startTime: "2024-12-25T10:00:00Z",
      endTime: "2024-12-25T10:50:00Z",
      duration: 50,
      type: "EMDR",
      progress: 100,
      recordingAvailable: true,
      notes: "Сессия прошла успешно"
    },
    {
      id: "3",
      therapistName: "Др. Козлов Андрей", 
      patientName: "Елена С.",
      status: "scheduled",
      startTime: "2024-12-25T16:00:00Z",
      duration: 45,
      type: "Consultation",
      recordingAvailable: false
    },
    {
      id: "4",
      therapistName: "Др. Петров Дмитрий",
      patientName: "Сергей К.",
      status: "cancelled",
      startTime: "2024-12-25T12:00:00Z",
      duration: 50,
      type: "EMDR",
      recordingAvailable: false,
      notes: "Отменена пациентом"
    },
    {
      id: "5",
      therapistName: "Др. Иванова Елена",
      patientName: "Ольга В.",
      status: "completed",
      startTime: "2024-12-24T15:00:00Z",
      endTime: "2024-12-24T15:45:00Z",
      duration: 45,
      type: "Follow-up",
      progress: 100,
      recordingAvailable: true
    }
  ];

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusLabel = (status: Session['status']) => {
    switch (status) {
      case 'active': return 'Активна';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      case 'scheduled': return 'Запланирована';
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'active': return PlayCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'scheduled': return Clock;
    }
  };

  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    const matchesType = typeFilter === "all" || session.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStats = () => {
    const total = mockSessions.length;
    const active = mockSessions.filter(s => s.status === 'active').length;
    const completed = mockSessions.filter(s => s.status === 'completed').length;
    const cancelled = mockSessions.filter(s => s.status === 'cancelled').length;
    const scheduled = mockSessions.filter(s => s.status === 'scheduled').length;
    
    return { total, active, completed, cancelled, scheduled };
  };

  const stats = getSessionStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Управление сессиями</h1>
                <p className="text-muted-foreground">Мониторинг и управление всеми терапевтическими сессиями</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-export-sessions">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button data-testid="button-schedule-session">
                <Calendar className="w-4 h-4 mr-2" />
                Запланировать сессию
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего сессий</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Активные</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Завершённые</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
                <p className="text-sm text-muted-foreground">Запланированные</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-sm text-muted-foreground">Отменённые</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Фильтры и поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск по терапевту или пациенту..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-sessions"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Статус сессии" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="completed">Завершённые</SelectItem>
                  <SelectItem value="scheduled">Запланированные</SelectItem>
                  <SelectItem value="cancelled">Отменённые</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48" data-testid="select-type-filter">
                  <SelectValue placeholder="Тип сессии" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="EMDR">EMDR</SelectItem>
                  <SelectItem value="Consultation">Консультация</SelectItem>
                  <SelectItem value="Follow-up">Повторная</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Список сессий</CardTitle>
            <CardDescription>Найдено сессий: {filteredSessions.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="sessions-list">
              {filteredSessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status);
                
                return (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`session-item-${session.id}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        <StatusIcon className={`w-6 h-6 ${
                          session.status === 'active' ? 'text-green-600' :
                          session.status === 'completed' ? 'text-blue-600' :
                          session.status === 'cancelled' ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                      </div>

                      {/* Therapist */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.therapistAvatar} />
                          <AvatarFallback className="bg-primary/10">
                            {session.therapistName.split(' ')[1]?.charAt(0) || 'Т'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{session.therapistName}</p>
                          <p className="text-sm text-muted-foreground">Терапевт</p>
                        </div>
                      </div>

                      {/* Patient */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.patientAvatar} />
                          <AvatarFallback className="bg-secondary/10">
                            {session.patientName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{session.patientName}</p>
                          <p className="text-sm text-muted-foreground">Пациент</p>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusLabel(session.status)}
                          </Badge>
                          <Badge variant="outline">
                            {session.type}
                          </Badge>
                          {session.recordingAvailable && (
                            <Badge variant="outline" className="text-green-600">
                              <VideoIcon className="w-3 h-3 mr-1" />
                              Запись
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDateTime(session.startTime)}
                          </span>
                          <span>{session.duration} мин</span>
                          {session.progress !== undefined && (
                            <span>Прогресс: {session.progress}%</span>
                          )}
                        </div>
                        
                        {session.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-view-session-${session.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </Button>
                      
                      {session.recordingAvailable && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-download-recording-${session.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Запись
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-session-menu-${session.id}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {filteredSessions.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Сессии не найдены</h3>
                  <p className="text-muted-foreground">
                    Попробуйте изменить критерии поиска или фильтры
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}