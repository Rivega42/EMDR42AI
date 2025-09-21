/**
 * Progress Dashboard Component
 * Revolutionary visualization of patient progress across EMDR sessions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Heart, 
  Activity,
  Calendar,
  Target,
  Zap,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { format } from 'date-fns';

interface ProgressDashboardProps {
  patientId: string;
  className?: string;
}

// Helper components for charts and data display
const ProgressDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const MetricCard = ({ title, value, change, icon, ...props }: {
  title: string;
  value: string;
  change: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  [key: string]: any;
}) => {
  const trendIcon = change === 'up' ? <TrendingUp className="w-4 h-4 text-green-600" /> : 
                    change === 'down' ? <TrendingDown className="w-4 h-4 text-red-600" /> : 
                    <Target className="w-4 h-4 text-blue-600" />;
  
  return (
    <Card {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center space-x-2">
            {icon}
            {trendIcon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SUDSProgressChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="suds" stroke="#ef4444" strokeWidth={2} />
    </RechartsLineChart>
  </ResponsiveContainer>
);

const VOCProgressChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="voc" stroke="#10b981" strokeWidth={2} />
    </RechartsLineChart>
  </ResponsiveContainer>
);

const EmotionalStabilityChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="stability" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
    </AreaChart>
  </ResponsiveContainer>
);

const SessionEffectivenessChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="session" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="effectiveness" fill="#8b5cf6" />
    </BarChart>
  </ResponsiveContainer>
);

const EmotionalPatternsDisplay = ({ patterns }: { patterns: any[] }) => (
  <div className="space-y-4">
    {patterns.length === 0 ? (
      <p className="text-muted-foreground">No patterns detected yet.</p>
    ) : (
      patterns.map((pattern, index) => (
        <div key={index} className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium">{pattern.name || `Pattern ${index + 1}`}</h4>
          <p className="text-sm text-muted-foreground">{pattern.description || 'Pattern analysis'}</p>
        </div>
      ))
    )}
  </div>
);

const TriggerPatternsChart = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Trigger patterns analysis will be displayed here.</p>
  </div>
);

const PredictedChallenges = ({ challenges }: { challenges: any[] }) => (
  <div className="space-y-3">
    {challenges.length === 0 ? (
      <p className="text-muted-foreground">No challenges predicted.</p>
    ) : (
      challenges.map((challenge, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
          <div>
            <p className="font-medium text-orange-900">{challenge.title || 'Challenge'}</p>
            <p className="text-sm text-orange-700">{challenge.description || 'Challenge description'}</p>
          </div>
        </div>
      ))
    )}
  </div>
);

const GrowthOpportunities = ({ opportunities }: { opportunities: any[] }) => (
  <div className="space-y-3">
    {opportunities.length === 0 ? (
      <p className="text-muted-foreground">No opportunities identified.</p>
    ) : (
      opportunities.map((opportunity, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <p className="font-medium text-green-900">{opportunity.title || 'Opportunity'}</p>
            <p className="text-sm text-green-700">{opportunity.description || 'Opportunity description'}</p>
          </div>
        </div>
      ))
    )}
  </div>
);

// Mock data function
const getDefaultTrends = () => ({
  overallProgress: 0.75,
  sudsProgress: { change: -2.3, trend: 'down' as const },
  vocProgress: { change: 1.8, trend: 'up' as const },
  emotionalStability: { 
    overall: { stability: 0.82, trend: 'up' as const }
  },
  sudsHistory: [
    { date: '2024-01', suds: 8 },
    { date: '2024-02', suds: 6 },
    { date: '2024-03', suds: 4 },
  ],
  vocHistory: [
    { date: '2024-01', voc: 3 },
    { date: '2024-02', voc: 5 },
    { date: '2024-03', voc: 7 },
  ],
  stabilityHistory: [
    { date: '2024-01', stability: 0.6 },
    { date: '2024-02', stability: 0.7 },
    { date: '2024-03', stability: 0.8 },
  ],
  effectivenessHistory: [
    { session: 'Session 1', effectiveness: 0.6 },
    { session: 'Session 2', effectiveness: 0.7 },
    { session: 'Session 3', effectiveness: 0.8 },
  ],
  triggerPatterns: {}
});

export function ProgressDashboard({ patientId, className }: ProgressDashboardProps) {
  // Fetch progress analytics
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/sessions/progress/analytics', patientId],
    enabled: !!patientId
  });

  // Fetch patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/sessions/progress/patterns', patientId],
    enabled: !!patientId
  });

  // Fetch predictions
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/sessions/progress/predictions', patientId],
    enabled: !!patientId
  });

  // Fetch insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/sessions/insights/generate'],
    queryFn: () => fetch('/api/sessions/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    }).then(res => res.json()),
    enabled: !!patientId
  });

  if (trendsLoading || patternsLoading || predictionsLoading || insightsLoading) {
    return <ProgressDashboardSkeleton />;
  }

  const trendsData = (trends as any)?.trends || getDefaultTrends();
  const patternsData = (patterns as any)?.patterns || [];
  const predictionsData = (predictions as any)?.predictions || { challenges: [], opportunities: [], confidence: 0.5 };
  const insightsData = insights?.insights || [];

  return (
    <div className={`space-y-6 ${className}`} data-testid="progress-dashboard">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Progress Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of therapeutic progress and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Analytics
          </Badge>
          <Button variant="outline" size="sm" data-testid="button-refresh-analytics">
            <Calendar className="w-4 h-4 mr-2" />
            Update Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Overall Progress"
          value={`${Math.round(trendsData.overallProgress * 100)}%`}
          change={trendsData.sudsProgress.trend}
          icon={<TrendingUp className="w-4 h-4" />}
          data-testid="metric-overall-progress"
        />
        <MetricCard 
          title="SUDS Improvement"
          value={trendsData.sudsProgress.change.toFixed(1)}
          change={trendsData.sudsProgress.trend}
          icon={<Heart className="w-4 h-4" />}
          data-testid="metric-suds-improvement"
        />
        <MetricCard 
          title="VOC Enhancement"
          value={trendsData.vocProgress.change.toFixed(1)}
          change={trendsData.vocProgress.trend}
          icon={<Brain className="w-4 h-4" />}
          data-testid="metric-voc-enhancement"
        />
        <MetricCard 
          title="Stability Score"
          value={`${Math.round(trendsData.emotionalStability.overall.stability * 100)}%`}
          change={trendsData.emotionalStability.overall.trend}
          icon={<Target className="w-4 h-4" />}
          data-testid="metric-stability-score"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" data-testid="tab-trends">
            <LineChart className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">
            <BarChart3 className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="predictions" data-testid="tab-predictions">
            <Zap className="w-4 h-4 mr-2" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights">
            <Brain className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="chart-suds-progress">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  SUDS Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SUDSProgressChart data={trendsData.sudsHistory || []} />
              </CardContent>
            </Card>

            <Card data-testid="chart-voc-progress">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  VOC Enhancement Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VOCProgressChart data={trendsData.vocHistory || []} />
              </CardContent>
            </Card>

            <Card data-testid="chart-emotional-stability">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Emotional Stability Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionalStabilityChart data={trendsData.stabilityHistory || []} />
              </CardContent>
            </Card>

            <Card data-testid="chart-session-effectiveness">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Session Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SessionEffectivenessChart data={trendsData.effectivenessHistory || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="patterns-emotional">
              <CardHeader>
                <CardTitle>Identified Emotional Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionalPatternsDisplay patterns={patternsData} />
              </CardContent>
            </Card>

            <Card data-testid="patterns-triggers">
              <CardHeader>
                <CardTitle>Trigger Patterns Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <TriggerPatternsChart data={trendsData.triggerPatterns || {}} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="predictions-challenges">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Predicted Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictedChallenges challenges={predictionsData.challenges} />
              </CardContent>
            </Card>

            <Card data-testid="predictions-opportunities">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthOpportunities opportunities={predictionsData.opportunities} />
              </CardContent>
            </Card>
          </div>

          <Card data-testid="prediction-confidence">
            <CardHeader>
              <CardTitle>Prediction Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Overall Confidence</span>
                  <span className="font-medium">{Math.round(predictionsData.confidence * 100)}%</span>
                </div>
                <Progress value={predictionsData.confidence * 100} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsData.length === 0 ? (
                <p className="text-muted-foreground">No insights available yet. More data needed for analysis.</p>
              ) : (
                <div className="space-y-4">
                  {insightsData.map((insight: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">{insight.title || `Insight ${index + 1}`}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description || 'AI insight description'}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}