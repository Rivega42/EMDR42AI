import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter,
  Mail,
  Phone,
  Star,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  UserPlus,
  Shield,
  Heart
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

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'therapists' | 'patients'>('overview');
  const [searchTerm, setSearchTerm] = useState("");
  const [therapistFilter, setTherapistFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState<string>("all");

  // Mock data - same as AdminDashboard
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
    },
    {
      id: "4",
      name: "Др. Смирнова Анна",
      email: "smirnova@emdr-platform.com",
      avatar: undefined,
      status: "active",
      specialization: "EMDR, ПТСР",
      patients: 15,
      rating: 4.7,
      joinDate: "2024-03-05",
      lastActive: "Сегодня в 11:20"
    },
    {
      id: "5",
      name: "Др. Волков Сергей",
      email: "volkov@emdr-platform.com",
      avatar: undefined,
      status: "suspended",
      specialization: "EMDR, Панические атаки",
      patients: 0,
      rating: 4.5,
      joinDate: "2024-04-12",
      lastActive: "5 дней назад"
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
    },
    {
      id: "4",
      name: "Сергей Козлов",
      email: "sergey@example.com",
      avatar: undefined,
      status: "inactive",
      therapist: "Др. Смирнова Анна",
      progress: 15,
      joinDate: "2024-11-20",
      lastSession: "2024-11-25"
    },
    {
      id: "5",
      name: "Ольга Волкова",
      email: "olga@example.com",
      avatar: undefined,
      status: "active",
      therapist: "Др. Иванова Елена",
      progress: 75,
      joinDate: "2024-09-10",
      lastSession: "2024-12-11"
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

  const filteredTherapists = mockTherapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = therapistFilter === "all" || therapist.status === therapistFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.therapist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = patientFilter === "all" || patient.status === patientFilter;
    return matchesSearch && matchesFilter;
  });

  const getUserStats = () => {
    const therapists = {
      total: mockTherapists.length,
      active: mockTherapists.filter(t => t.status === 'active').length,
      pending: mockTherapists.filter(t => t.status === 'pending').length,
      suspended: mockTherapists.filter(t => t.status === 'suspended').length
    };
    
    const patients = {
      total: mockPatients.length,
      active: mockPatients.filter(p => p.status === 'active').length,
      inactive: mockPatients.filter(p => p.status === 'inactive').length,
      completed: mockPatients.filter(p => p.status === 'completed').length
    };
    
    return { therapists, patients };
  };

  const stats = getUserStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Управление пользователями</h1>
                <p className="text-muted-foreground">Управление терапевтами и пациентами платформы</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" data-testid="button-export-users">
                <UserPlus className="w-4 h-4 mr-2" />
                Пригласить терапевта
              </Button>
              <Button data-testid="button-bulk-actions">
                <Shield className="w-4 h-4 mr-2" />
                Массовые операции
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-users-overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="therapists" data-testid="tab-users-therapists">
              <UserCheck className="w-4 h-4 mr-2" />
              Терапевты ({stats.therapists.total})
            </TabsTrigger>
            <TabsTrigger value="patients" data-testid="tab-users-patients">
              <Heart className="w-4 h-4 mr-2" />
              Пациенты ({stats.patients.total})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Therapists Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5" />
                    <span>Терапевты</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-card-foreground">{stats.therapists.total}</p>
                      <p className="text-sm text-muted-foreground">Всего</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.therapists.active}</p>
                      <p className="text-sm text-muted-foreground">Активные</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.therapists.pending}</p>
                      <p className="text-sm text-muted-foreground">Ожидают</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.therapists.suspended}</p>
                      <p className="text-sm text-muted-foreground">Заблокированы</p>
                    </div>
                  </div>
                  
                  <Button className="w-full" data-testid="button-manage-therapists">
                    Управлять терапевтами
                  </Button>
                </CardContent>
              </Card>

              {/* Patients Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5" />
                    <span>Пациенты</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-card-foreground">{stats.patients.total}</p>
                      <p className="text-sm text-muted-foreground">Всего</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.patients.active}</p>
                      <p className="text-sm text-muted-foreground">Активные</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{stats.patients.inactive}</p>
                      <p className="text-sm text-muted-foreground">Неактивные</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.patients.completed}</p>
                      <p className="text-sm text-muted-foreground">Завершили</p>
                    </div>
                  </div>
                  
                  <Button className="w-full" data-testid="button-manage-patients">
                    Управлять пациентами
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Therapists Tab */}
          <TabsContent value="therapists" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Поиск и фильтры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Поиск терапевтов..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-therapists"
                      />
                    </div>
                  </div>
                  
                  <Select value={therapistFilter} onValueChange={setTherapistFilter}>
                    <SelectTrigger className="w-48" data-testid="select-therapist-filter">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="pending">Ожидающие</SelectItem>
                      <SelectItem value="suspended">Заблокированные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Therapists List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="therapists-list">
              {filteredTherapists.map((therapist) => (
                <Card key={therapist.id} className="hover-elevate" data-testid={`therapist-item-${therapist.id}`}>
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
                      {therapist.rating > 0 && (
                        <p className="flex items-center">
                          <span className="font-medium mr-1">Рейтинг:</span>
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          {therapist.rating}
                        </p>
                      )}
                      <p><span className="font-medium">Дата регистрации:</span> {new Date(therapist.joinDate).toLocaleDateString('ru-RU')}</p>
                      <p><span className="font-medium">Последняя активность:</span> {therapist.lastActive}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-therapist-${therapist.id}`}>
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
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Поиск и фильтры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Поиск пациентов..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-patients"
                      />
                    </div>
                  </div>
                  
                  <Select value={patientFilter} onValueChange={setPatientFilter}>
                    <SelectTrigger className="w-48" data-testid="select-patient-filter">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="inactive">Неактивные</SelectItem>
                      <SelectItem value="completed">Завершённые</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Patients List */}
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0" data-testid="patients-list">
                  {filteredPatients.map((patient, index) => (
                    <div 
                      key={patient.id} 
                      className={`flex items-center justify-between p-6 hover-elevate ${
                        index !== filteredPatients.length - 1 ? 'border-b border-border' : ''
                      }`}
                      data-testid={`patient-item-${patient.id}`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback className="bg-secondary/10">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-card-foreground">{patient.name}</h3>
                            <Badge className={getPatientStatusColor(patient.status)}>
                              {getPatientStatusLabel(patient.status)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="font-medium">Email:</p>
                              <p>{patient.email}</p>
                            </div>
                            <div>
                              <p className="font-medium">Терапевт:</p>
                              <p>{patient.therapist}</p>
                            </div>
                            <div>
                              <p className="font-medium">Последняя сессия:</p>
                              <p>{new Date(patient.lastSession).toLocaleDateString('ru-RU')}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Прогресс лечения</span>
                              <span>{patient.progress}%</span>
                            </div>
                            <Progress value={patient.progress} className="h-2" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" data-testid={`button-view-patient-${patient.id}`}>
                          Профиль
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-patient-menu-${patient.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredPatients.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Пациенты не найдены</h3>
                      <p className="text-muted-foreground">
                        Попробуйте изменить критерии поиска или фильтры
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}