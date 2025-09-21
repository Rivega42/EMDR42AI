/**
 * Session Comparison Component
 * Advanced comparison between EMDR therapy sessions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart, 
  Brain, 
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';

interface SessionComparisonProps {
  patientId: string;
  className?: string;
}

interface Session {
  id: string;
  startTime: string;
  phase: string;
  sudsStart?: number;
  sudsEnd?: number;
  vocStart?: number;
  vocEnd?: number;
}

interface SessionComparison {
  id: string;
  baselineSessionId: string;
  compareSessionId: string;
  comparisonType: string;
  improvementAreas?: string[];
  concernAreas?: string[];
  aiInsights?: {
    summary: string;
    recommendations: string[];
  };
  metricsComparison?: {
    sudsDelta: number;
    vocDelta: number;
    effectivenessDelta: number;
  };
}

interface CompareSessionsRequest {
  patientId: string;
  baselineSessionId: string;
  compareSessionId: string;
  comparisonType: string;
  includeAIAnalysis: boolean;
}

// Helper components
const SessionComparisonSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ComparisonOverview = ({ comparison }: { comparison: SessionComparison }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="text-center">
      <p className="text-sm text-muted-foreground">SUDS Change</p>
      <p className="text-2xl font-bold">{comparison.metricsComparison?.sudsDelta?.toFixed(1) || 'N/A'}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-muted-foreground">VOC Change</p>
      <p className="text-2xl font-bold">{comparison.metricsComparison?.vocDelta?.toFixed(1) || 'N/A'}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-muted-foreground">Effectiveness</p>
      <p className="text-2xl font-bold">{comparison.metricsComparison?.effectivenessDelta?.toFixed(1) || 'N/A'}</p>
    </div>
  </div>
);

const MetricsComparison = ({ comparison }: { comparison: SessionComparison }) => {
  const chartData = [
    { metric: 'SUDS', baseline: 6, compare: 4 },
    { metric: 'VOC', baseline: 4, compare: 6 },
    { metric: 'Effectiveness', baseline: 0.6, compare: 0.8 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="metric" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="baseline" fill="#94a3b8" name="Baseline Session" />
        <Bar dataKey="compare" fill="#3b82f6" name="Compare Session" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const EmotionalRadarChart = ({ comparison }: { comparison: SessionComparison }) => {
  const radarData = [
    { emotion: 'Anxiety', baseline: 8, compare: 4 },
    { emotion: 'Confidence', baseline: 3, compare: 7 },
    { emotion: 'Control', baseline: 4, compare: 8 },
    { emotion: 'Stability', baseline: 5, compare: 7 },
    { emotion: 'Progress', baseline: 4, compare: 8 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="emotion" />
        <PolarRadiusAxis angle={90} domain={[0, 10]} />
        <Radar name="Baseline" dataKey="baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
        <Radar name="Compare" dataKey="compare" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const ImprovementsList = ({ improvements }: { improvements: string[] }) => (
  <div className="space-y-3">
    {improvements.length === 0 ? (
      <p className="text-muted-foreground">No specific improvements identified.</p>
    ) : (
      improvements.map((improvement, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
          <p className="text-green-900">{improvement}</p>
        </div>
      ))
    )}
  </div>
);

const ConcernsList = ({ concerns }: { concerns: string[] }) => (
  <div className="space-y-3">
    {concerns.length === 0 ? (
      <p className="text-muted-foreground">No areas of concern identified.</p>
    ) : (
      concerns.map((concern, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
          <p className="text-orange-900">{concern}</p>
        </div>
      ))
    )}
  </div>
);

const AIInsightsDisplay = ({ insights }: { insights: SessionComparison['aiInsights'] }) => {
  if (!insights) {
    return <p className="text-muted-foreground">AI analysis not available for this comparison.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Summary</h4>
        <p className="text-muted-foreground">{insights.summary}</p>
      </div>
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-blue-600 mt-1" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export function SessionComparison({ patientId, className }: SessionComparisonProps) {
  const [selectedBaseline, setSelectedBaseline] = useState<string>('');
  const [selectedCompare, setSelectedCompare] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch available sessions for this patient
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/sessions/patient', patientId],
    enabled: !!patientId
  });

  // Fetch existing comparisons
  const { data: existingComparisons } = useQuery({
    queryKey: ['/api/sessions/memory/comparisons', patientId],
    enabled: !!patientId
  });

  // Compare sessions mutation
  const compareSessionsMutation = useMutation({
    mutationFn: (request: CompareSessionsRequest) =>
      apiRequest('/api/sessions/memory/compare', 'POST', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/memory/comparisons', patientId] });
    }
  });

  const sessionsList = (sessions as any)?.sessions || [];
  const comparisonsList = (existingComparisons as any)?.comparisons || [];

  const handleCompare = () => {
    if (!selectedBaseline || !selectedCompare) return;

    compareSessionsMutation.mutate({
      patientId,
      baselineSessionId: selectedBaseline,
      compareSessionId: selectedCompare,
      comparisonType: 'manual',
      includeAIAnalysis: true
    });
  };

  // Find current comparison if exists
  const currentComparison = comparisonsList.find(
    (c: SessionComparison) => 
      c.baselineSessionId === selectedBaseline && c.compareSessionId === selectedCompare
  );

  if (sessionsLoading) {
    return <SessionComparisonSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="session-comparison">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Comparison</h2>
          <p className="text-muted-foreground">
            Compare therapeutic progress between EMDR sessions
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Advanced Analytics
        </Badge>
      </div>

      {/* Session Selection */}
      <Card data-testid="session-selector">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Select Sessions to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Baseline Session</label>
              <Select value={selectedBaseline} onValueChange={setSelectedBaseline}>
                <SelectTrigger data-testid="select-baseline-session">
                  <SelectValue placeholder="Select baseline session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionsList.map((session: Session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {format(new Date(session.startTime), 'MMM dd, yyyy')} - {session.phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Compare Session</label>
              <Select value={selectedCompare} onValueChange={setSelectedCompare}>
                <SelectTrigger data-testid="select-compare-session">
                  <SelectValue placeholder="Select session to compare" />
                </SelectTrigger>
                <SelectContent>
                  {sessionsList
                    .filter((session: Session) => session.id !== selectedBaseline)
                    .map((session: Session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {format(new Date(session.startTime), 'MMM dd, yyyy')} - {session.phase}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCompare}
              disabled={!selectedBaseline || !selectedCompare || compareSessionsMutation.isPending}
              data-testid="button-compare-sessions"
            >
              {compareSessionsMutation.isPending ? 'Comparing...' : 'Compare Sessions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {currentComparison && (
        <div className="space-y-6">
          {/* Comparison Overview */}
          <Card data-testid="comparison-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Comparison Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonOverview comparison={currentComparison} />
            </CardContent>
          </Card>

          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="metrics-comparison">
              <CardHeader>
                <CardTitle>Key Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricsComparison comparison={currentComparison} />
              </CardContent>
            </Card>

            <Card data-testid="emotional-radar">
              <CardHeader>
                <CardTitle>Emotional State Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionalRadarChart comparison={currentComparison} />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="improvements-areas">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Improvement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImprovementsList improvements={currentComparison.improvementAreas || []} />
              </CardContent>
            </Card>

            <Card data-testid="concern-areas">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Areas of Concern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConcernsList concerns={currentComparison.concernAreas || []} />
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {currentComparison.aiInsights && (
            <Card data-testid="ai-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIInsightsDisplay insights={currentComparison.aiInsights} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No comparison selected state */}
      {!currentComparison && (selectedBaseline || selectedCompare) && (
        <Card>
          <CardContent className="p-8 text-center">
            <ArrowUpDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select Sessions to Compare</h3>
            <p className="text-muted-foreground">
              Choose both a baseline session and a comparison session to view detailed analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}