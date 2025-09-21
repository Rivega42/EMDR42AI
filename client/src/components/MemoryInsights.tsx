/**
 * Memory Insights Component
 * AI-powered insights based on historical session data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock,
  Zap,
  Eye,
  Shield,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface MemoryInsightsProps {
  patientId: string;
  className?: string;
}

interface MemoryInsight {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  insightType: 'pattern_analysis' | 'progress_summary' | 'risk_assessment' | 'recommendation';
  confidence: number;
  generatedAt: string;
}

interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  triggers?: string[];
  recommendations?: string[];
}

// Helper components
const MemoryInsightsSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const CriticalInsightsList = ({ insights }: { insights: MemoryInsight[] }) => (
  <div className="space-y-4">
    {insights.map((insight) => (
      <div key={insight.id} className="p-4 bg-red-100 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900">{insight.title}</h4>
            <p className="text-sm text-red-700 mt-1">{insight.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {insight.priority}
              </Badge>
              <span className="text-xs text-red-600">
                Confidence: {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ActionableInsightsList = ({ insights }: { insights: MemoryInsight[] }) => (
  <div className="space-y-4">
    {insights.map((insight) => (
      <div key={insight.id} className="p-4 bg-blue-100 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">{insight.title}</h4>
            <p className="text-sm text-blue-700 mt-1">{insight.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs border-blue-300">
                {insight.insightType}
              </Badge>
              <span className="text-xs text-blue-600">
                Confidence: {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmotionalPatternsInsights = ({ patterns, insights }: { 
  patterns: EmotionalPattern[], 
  insights: MemoryInsight[] 
}) => (
  <div className="space-y-4">
    {patterns.length === 0 && insights.length === 0 ? (
      <p className="text-muted-foreground">No emotional patterns detected yet.</p>
    ) : (
      <>
        {patterns.map((pattern) => (
          <div key={pattern.id} className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{pattern.name}</h4>
              <Badge variant={pattern.impact === 'positive' ? 'default' : pattern.impact === 'negative' ? 'destructive' : 'secondary'}>
                {pattern.impact}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Frequency: {pattern.frequency}x</span>
              {pattern.triggers && pattern.triggers.length > 0 && (
                <span>• Triggers: {pattern.triggers.join(', ')}</span>
              )}
            </div>
          </div>
        ))}
        {insights.map((insight) => (
          <div key={insight.id} className="p-3 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900">{insight.title}</h5>
            <p className="text-sm text-blue-700">{insight.description}</p>
          </div>
        ))}
      </>
    )}
  </div>
);

const BehavioralPatternsInsights = ({ patterns }: { patterns: EmotionalPattern[] }) => (
  <div className="space-y-4">
    {patterns.length === 0 ? (
      <p className="text-muted-foreground">No behavioral patterns identified.</p>
    ) : (
      patterns.filter(p => p.name?.toLowerCase().includes('behavior') || p.description?.toLowerCase().includes('behavior')).map((pattern) => (
        <div key={pattern.id} className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">{pattern.name}</h4>
          <p className="text-sm text-muted-foreground">{pattern.description}</p>
          {pattern.recommendations && pattern.recommendations.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {pattern.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

const PatternRecommendations = ({ patterns }: { patterns: EmotionalPattern[] }) => {
  const allRecommendations = patterns.flatMap(p => p.recommendations || []);
  
  return (
    <div className="space-y-3">
      {allRecommendations.length === 0 ? (
        <p className="text-muted-foreground">No pattern-based recommendations available.</p>
      ) : (
        allRecommendations.map((rec, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-green-600 mt-1" />
            <p className="text-green-900">{rec}</p>
          </div>
        ))
      )}
    </div>
  );
};

const ProgressSummaryInsights = ({ insights }: { insights: MemoryInsight[] }) => (
  <div className="space-y-4">
    {insights.length === 0 ? (
      <p className="text-muted-foreground">No progress insights available.</p>
    ) : (
      insights.map((insight) => (
        <div key={insight.id} className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900">{insight.title}</h4>
          <p className="text-sm text-green-700 mt-1">{insight.description}</p>
          <div className="mt-2">
            <span className="text-xs text-green-600">
              Generated: {format(new Date(insight.generatedAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      ))
    )}
  </div>
);

const MilestoneAnalysis = ({ insights }: { insights: MemoryInsight[] }) => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Milestone analysis based on progress insights.</p>
    {insights.filter(i => i.title?.toLowerCase().includes('milestone')).map((insight) => (
      <div key={insight.id} className="p-3 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900">{insight.title}</h5>
        <p className="text-sm text-blue-700">{insight.description}</p>
      </div>
    ))}
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
            <p className="font-medium text-orange-900">{challenge.title || 'Predicted Challenge'}</p>
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
            <p className="font-medium text-green-900">{opportunity.title || 'Growth Opportunity'}</p>
            <p className="text-sm text-green-700">{opportunity.description || 'Opportunity description'}</p>
          </div>
        </div>
      ))
    )}
  </div>
);

const PredictionConfidence = ({ confidence }: { confidence: number }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span>Model Confidence</span>
      <span className="font-medium">{Math.round(confidence * 100)}%</span>
    </div>
    <Progress value={confidence * 100} className="w-full" />
    <p className="text-sm text-muted-foreground">
      Based on {confidence > 0.8 ? 'extensive' : confidence > 0.6 ? 'moderate' : 'limited'} historical data analysis.
    </p>
  </div>
);

const RiskAssessment = ({ insights }: { insights: MemoryInsight[] }) => (
  <div className="space-y-4">
    {insights.length === 0 ? (
      <p className="text-muted-foreground">No risk assessments available.</p>
    ) : (
      insights.map((insight) => (
        <div key={insight.id} className="p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-1" />
            <div>
              <h4 className="font-medium text-amber-900">{insight.title}</h4>
              <p className="text-sm text-amber-700 mt-1">{insight.description}</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Risk Level: {insight.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

export function MemoryInsights({ patientId, className }: MemoryInsightsProps) {
  // Fetch insights
  const { data: insightsResponse, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/sessions/insights/generate'],
    queryFn: () => fetch('/api/sessions/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    }).then(res => res.json()),
    enabled: !!patientId
  });

  // Fetch patterns
  const { data: patternsResponse, isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/sessions/progress/patterns', patientId],
    enabled: !!patientId
  });

  // Fetch predictions
  const { data: predictionsResponse, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/sessions/progress/predictions', patientId],
    enabled: !!patientId
  });

  if (insightsLoading || patternsLoading || predictionsLoading) {
    return <MemoryInsightsSkeleton />;
  }

  const insights = insightsResponse?.insights || [];
  const patterns = (patternsResponse as any)?.patterns || [];
  const predictions = (predictionsResponse as any)?.predictions || { challenges: [], opportunities: [], confidence: 0.5 };

  // Categorize insights
  const criticalInsights = insights.filter((i: MemoryInsight) => i.priority === 'critical');
  const actionableInsights = insights.filter((i: MemoryInsight) => i.actionable);
  const patternInsights = insights.filter((i: MemoryInsight) => i.insightType === 'pattern_analysis');
  const progressInsights = insights.filter((i: MemoryInsight) => i.insightType === 'progress_summary');
  const riskInsights = insights.filter((i: MemoryInsight) => i.insightType === 'risk_assessment');

  return (
    <div className={`space-y-6 ${className}`} data-testid="memory-insights">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Memory Insights</h2>
          <p className="text-muted-foreground">
            AI-powered insights from historical therapy data
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          {insights.length} Active Insights
        </Badge>
      </div>

      {/* Critical Alerts */}
      {criticalInsights.length > 0 && (
        <Card className="border-red-200 bg-red-50" data-testid="critical-insights">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Insights - Immediate Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CriticalInsightsList insights={criticalInsights} />
          </CardContent>
        </Card>
      )}

      {/* Actionable Insights */}
      {actionableInsights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50" data-testid="actionable-insights">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Actionable Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionableInsightsList insights={actionableInsights} />
          </CardContent>
        </Card>
      )}

      {/* Main Insights Tabs */}
      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns" data-testid="tab-pattern-insights">
            <Activity className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress-insights">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="predictions" data-testid="tab-prediction-insights">
            <Zap className="w-4 h-4 mr-2" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risk-insights">
            <Shield className="w-4 h-4 mr-2" />
            Risk Assessment
          </TabsTrigger>
        </TabsList>

        {/* Pattern Insights */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="emotional-patterns-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Emotional Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionalPatternsInsights 
                  patterns={patterns} 
                  insights={patternInsights} 
                />
              </CardContent>
            </Card>

            <Card data-testid="behavioral-patterns-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Behavioral Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BehavioralPatternsInsights patterns={patterns} />
              </CardContent>
            </Card>
          </div>

          <Card data-testid="pattern-recommendations">
            <CardHeader>
              <CardTitle>Pattern-Based Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <PatternRecommendations patterns={patterns} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Insights */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="progress-summary">
              <CardHeader>
                <CardTitle>Progress Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressSummaryInsights insights={progressInsights} />
              </CardContent>
            </Card>

            <Card data-testid="milestone-analysis">
              <CardHeader>
                <CardTitle>Milestone Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <MilestoneAnalysis insights={progressInsights} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prediction Insights */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="future-challenges">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Predicted Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictedChallenges challenges={predictions.challenges} />
              </CardContent>
            </Card>

            <Card data-testid="future-opportunities">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthOpportunities opportunities={predictions.opportunities} />
              </CardContent>
            </Card>
          </div>

          <Card data-testid="prediction-confidence">
            <CardHeader>
              <CardTitle>Prediction Model Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <PredictionConfidence confidence={predictions.confidence} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment */}
        <TabsContent value="risks" className="space-y-6">
          <Card data-testid="risk-assessment">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Assessment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskAssessment insights={riskInsights} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}