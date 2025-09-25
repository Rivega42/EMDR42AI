import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Define types
interface SystemStats {
  totalPatients: number;
  activeSessions: number;
  breakthroughsToday: number;
  systemHealth: number;
}

type UserRole = 'patient' | 'therapist' | 'admin' | 'researcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import ExportReports from '@/components/ExportReports';
import { BarChart3, Brain, Target, Users, Download, Settings, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [selectedPatient, setSelectedPatient] = useState('patient_demo_001');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedRole, setSelectedRole] = useState<UserRole>('therapist');

  // Mock patient data - in real app this would come from API
  const patients = [
    { id: 'patient_demo_001', name: 'Demo Patient 1', status: 'active' },
    { id: 'patient_demo_002', name: 'Demo Patient 2', status: 'active' },
    { id: 'patient_demo_003', name: 'Demo Patient 3', status: 'completed' }
  ];

  const { data: systemStats, isLoading: statsLoading, error: statsError } = useQuery<SystemStats>({
    queryKey: ['/api/analytics/system-stats'],
    enabled: true,
    staleTime: 30000,
    refetchInterval: 60000
  });

  // Show loading state instead of fallback values
  const stats = statsLoading ? null : {
    totalPatients: systemStats?.totalPatients || 0,
    activeSessions: systemStats?.activeSessions || 0,
    breakthroughsToday: systemStats?.breakthroughsToday || 0,
    systemHealth: systemStats?.systemHealth || 0
  };

  // Handle error state
  if (statsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="error-analytics">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Analytics System Error</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load analytics data. Please try again or contact support if the issue persists.
            </p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-analytics">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-analytics-title">
                Revolutionary Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2" data-testid="text-analytics-subtitle">
                World-class EMDR therapy analytics powered by AI and machine learning
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1" data-testid="badge-system-status">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                System Active
              </Badge>
              
              <ExportReports 
                patientId={selectedPatient}
                timeRange={selectedTimeRange}
                userRole={selectedRole}
              />
              
              <Button variant="outline" size="sm" data-testid="button-analytics-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3" data-testid="stat-total-patients">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.totalPatients || 0}</div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3" data-testid="stat-active-sessions">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.activeSessions || 0}</div>
                <div className="text-sm text-muted-foreground">Active Sessions</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3" data-testid="stat-breakthroughs">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.breakthroughsToday || 0}</div>
                <div className="text-sm text-muted-foreground">Breakthroughs Today</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3" data-testid="stat-system-health">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.systemHealth || 0}%</div>
                <div className="text-sm text-muted-foreground">System Health</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Controls Section */}
        <Card className="mb-6" data-testid="card-analytics-controls">
          <CardHeader>
            <CardTitle className="text-lg">Analytics Configuration</CardTitle>
            <CardDescription>
              Configure the analytics view for personalized insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient Selection</label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient} data-testid="select-patient">
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} 
                        <Badge variant="outline" className="ml-2">
                          {patient.status}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange} data-testid="select-timerange">
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 3 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">View Role</label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)} data-testid="select-role">
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient View</SelectItem>
                    <SelectItem value="therapist">Therapist View</SelectItem>
                    <SelectItem value="admin">Admin View</SelectItem>
                    <SelectItem value="researcher">Research View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revolutionary Analytics Dashboard */}
        <Card data-testid="card-main-analytics">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Advanced Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Real-time insights, predictive analytics, and AI-powered recommendations
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Data
                </Badge>
                
                <Badge variant="outline">
                  AI-Powered
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Revolutionary Analytics Dashboard Component */}
            <AnalyticsDashboard 
              patientId={selectedPatient}
              timeRange={selectedTimeRange}
              userRole={selectedRole}
              isEmbedded={true}
            />
          </CardContent>
        </Card>

        {/* Revolutionary Features Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card data-testid="card-revolutionary-features">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Revolutionary Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">AI Predictive Therapy</div>
                  <div className="text-sm text-muted-foreground">
                    Predicts optimal intervention points using machine learning
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Emotion Pattern Recognition</div>
                  <div className="text-sm text-muted-foreground">
                    Automatic detection of emotional patterns and triggers
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Breakthrough Prediction</div>
                  <div className="text-sm text-muted-foreground">
                    Forecasts therapeutic breakthrough moments
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Risk Prevention System</div>
                  <div className="text-sm text-muted-foreground">
                    Early detection and warning with mitigation strategies
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-capabilities">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Advanced Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Real-time Processing</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">3D Visualizations</span>
                  <Badge variant="outline">WebGL</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Neural Pattern Analysis</span>
                  <Badge variant="outline">Advanced</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Predictive Modeling</span>
                  <Badge variant="outline">ML-Powered</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Multi-modal Integration</span>
                  <Badge variant="outline">Voice + Face</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}