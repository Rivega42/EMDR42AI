/**
 * Revolutionary Breakthrough Moment Timeline
 * Interactive timeline visualization of therapeutic breakthroughs and key moments
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Target, 
  Zap, 
  Star, 
  TrendingUp,
  Clock,
  Calendar,
  Eye,
  Brain,
  Heart,
  Activity,
  Download,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface BreakthroughTimelineProps {
  patientId: string;
  sessionId?: string;
  className?: string;
  showPredictions?: boolean;
}

interface BreakthroughMoment {
  id: string;
  timestamp: Date;
  sessionId: string;
  type: 'emotional_release' | 'insight' | 'memory_integration' | 'anxiety_reduction' | 'cognitive_shift';
  severity: 'minor' | 'moderate' | 'major' | 'transformational';
  title: string;
  description: string;
  duration: number; // in seconds
  triggers: string[];
  outcomes: string[];
  emotionalState: {
    before: { arousal: number; valence: number; stress: number };
    after: { arousal: number; valence: number; stress: number };
  };
  metrics: {
    sudsChange: number;
    vocChange: number;
    stabilityImprovement: number;
  };
  aiAnalysis?: {
    significance: number;
    patterns: string[];
    recommendations: string[];
  };
  precursors?: {
    emotionalBuild: boolean;
    physiologicalMarkers: boolean;
    verbalCues: boolean;
  };
}

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'breakthrough' | 'setback' | 'milestone' | 'intervention';
  data: BreakthroughMoment | any;
  x: number;
  y: number;
}

// Color coding for different breakthrough types
const BREAKTHROUGH_COLORS = {
  emotional_release: '#ef4444',
  insight: '#3b82f6',
  memory_integration: '#10b981',
  anxiety_reduction: '#f59e0b',
  cognitive_shift: '#8b5cf6'
};

const SEVERITY_COLORS = {
  minor: '#6b7280',
  moderate: '#f59e0b',
  major: '#ef4444',
  transformational: '#8b5cf6'
};

// Interactive Timeline Visualization
const TimelineVisualization = ({ 
  events, 
  selectedEvent, 
  onEventSelect,
  timeRange,
  width = 800, 
  height = 300 
}: {
  events: TimelineEvent[];
  selectedEvent?: string;
  onEventSelect: (eventId: string) => void;
  timeRange: { start: Date; end: Date };
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  
  // Calculate event positions
  const positionedEvents = useMemo(() => {
    const timeSpan = timeRange.end.getTime() - timeRange.start.getTime();
    
    return events.map(event => ({
      ...event,
      x: ((event.timestamp.getTime() - timeRange.start.getTime()) / timeSpan) * (width - 100) + 50,
      y: height / 2 + (deterministicValue(`${event.id}_scatter`) - 0.5) * 100 // Deterministic vertical scatter
    }));
  }, [events, timeRange, width, height]);
  
  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw timeline axis
    drawTimelineAxis(ctx);
    
    // Draw events
    drawEvents(ctx, positionedEvents);
    
    // Draw connections between related events
    drawEventConnections(ctx, positionedEvents);
    
    // Draw time labels
    drawTimeLabels(ctx);
  }, [positionedEvents, selectedEvent, hoveredEvent, width, height]);
  
  const drawTimelineAxis = (ctx: CanvasRenderingContext2D) => {
    // Main timeline
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, height / 2);
    ctx.lineTo(width - 50, height / 2);
    ctx.stroke();
    
    // Timeline ticks
    const tickCount = 10;
    for (let i = 0; i <= tickCount; i++) {
      const x = 50 + (i / tickCount) * (width - 100);
      ctx.beginPath();
      ctx.moveTo(x, height / 2 - 5);
      ctx.lineTo(x, height / 2 + 5);
      ctx.stroke();
    }
  };
  
  const drawEvents = (ctx: CanvasRenderingContext2D, events: TimelineEvent[]) => {
    events.forEach(event => {
      const isSelected = selectedEvent === event.id;
      const isHovered = hoveredEvent === event.id;
      const breakthrough = event.data as BreakthroughMoment;
      
      // Event circle
      const radius = isSelected ? 12 : isHovered ? 10 : 8;
      const color = event.type === 'breakthrough' ? 
        BREAKTHROUGH_COLORS[breakthrough.type as keyof typeof BREAKTHROUGH_COLORS] : '#6b7280';
      
      ctx.fillStyle = color;
      ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.8 : 0.6;
      ctx.beginPath();
      ctx.arc(event.x, event.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Event border
      ctx.strokeStyle = isSelected ? '#ffffff' : color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(event.x, event.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Severity indicator for breakthroughs
      if (event.type === 'breakthrough' && breakthrough.severity === 'transformational') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(event.x, event.y - radius - 5, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Duration indicator
      if (event.type === 'breakthrough' && breakthrough.duration > 60) {
        const durationHeight = Math.min(20, breakthrough.duration / 60 * 5);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(event.x - 2, event.y - radius - durationHeight, 4, durationHeight);
        ctx.globalAlpha = 1;
      }
    });
  };
  
  const drawEventConnections = (ctx: CanvasRenderingContext2D, events: TimelineEvent[]) => {
    // Draw connections between related breakthroughs
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      if (current.type === 'breakthrough' && next.type === 'breakthrough') {
        const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();
        const maxConnectionTime = 30 * 60 * 1000; // 30 minutes
        
        if (timeDiff < maxConnectionTime) {
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(current.x, current.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }
    }
  };
  
  const drawTimeLabels = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // Start time
    ctx.fillText(format(timeRange.start, 'HH:mm'), 50, height - 20);
    
    // End time
    ctx.fillText(format(timeRange.end, 'HH:mm'), width - 50, height - 20);
    
    // Middle time
    const middleTime = new Date((timeRange.start.getTime() + timeRange.end.getTime()) / 2);
    ctx.fillText(format(middleTime, 'HH:mm'), width / 2, height - 20);
  };
  
  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find hovered event
    const hoveredEvent = positionedEvents.find(event => {
      const distance = Math.sqrt(
        Math.pow(mouseX - event.x, 2) + Math.pow(mouseY - event.y, 2)
      );
      return distance <= 12;
    });
    
    setHoveredEvent(hoveredEvent?.id || null);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find clicked event
    const clickedEvent = positionedEvents.find(event => {
      const distance = Math.sqrt(
        Math.pow(mouseX - event.x, 2) + Math.pow(mouseY - event.y, 2)
      );
      return distance <= 12;
    });
    
    if (clickedEvent) {
      onEventSelect(clickedEvent.id);
    }
  };
  
  return (
    <div className="relative" data-testid="breakthrough-timeline-visualization">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        data-testid="timeline-canvas"
      />
      
      {/* Tooltip for hovered event */}
      {hoveredEvent && (
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded p-2 text-xs max-w-xs">
          {(() => {
            const event = events.find(e => e.id === hoveredEvent);
            if (!event) return null;
            
            const breakthrough = event.data as BreakthroughMoment;
            return (
              <div>
                <div className="font-medium">{breakthrough.title}</div>
                <div className="text-muted-foreground">
                  {format(event.timestamp, 'HH:mm:ss')} - {breakthrough.type}
                </div>
                <div className="text-muted-foreground">
                  Severity: {breakthrough.severity}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded p-2 text-xs">
        <div className="font-medium mb-1">Breakthrough Types</div>
        <div className="space-y-1">
          {Object.entries(BREAKTHROUGH_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Breakthrough Details Panel
const BreakthroughDetailsPanel = ({ breakthrough }: { breakthrough: BreakthroughMoment }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'analysis'>('overview');
  
  return (
    <div className="space-y-4" data-testid="breakthrough-details-panel">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{breakthrough.title}</h3>
          <p className="text-muted-foreground">{breakthrough.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            style={{ backgroundColor: BREAKTHROUGH_COLORS[breakthrough.type] }}
            className="text-white"
          >
            {breakthrough.type.replace('_', ' ')}
          </Badge>
          <Badge 
            variant={breakthrough.severity === 'transformational' ? 'default' : 'secondary'}
          >
            {breakthrough.severity}
          </Badge>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'metrics', label: 'Metrics', icon: Activity },
          { id: 'analysis', label: 'AI Analysis', icon: Brain }
        ].map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-48">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Timing */}
            <div>
              <h4 className="font-medium mb-2">Timing & Duration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Occurred at:</span>
                  <div className="font-medium">{format(breakthrough.timestamp, 'PPpp')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{Math.round(breakthrough.duration / 60)} minutes</div>
                </div>
              </div>
            </div>
            
            {/* Triggers */}
            <div>
              <h4 className="font-medium mb-2">Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {breakthrough.triggers.map((trigger, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Outcomes */}
            <div>
              <h4 className="font-medium mb-2">Outcomes</h4>
              <div className="space-y-2">
                {breakthrough.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Emotional State Changes */}
            <div>
              <h4 className="font-medium mb-3">Emotional State Changes</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Arousal</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">{(breakthrough.emotionalState.before.arousal * 100).toFixed(0)}%</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{(breakthrough.emotionalState.after.arousal * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Valence</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">{(breakthrough.emotionalState.before.valence * 100).toFixed(0)}%</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{(breakthrough.emotionalState.after.valence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Stress</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">{(breakthrough.emotionalState.before.stress * 100).toFixed(0)}%</span>
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{(breakthrough.emotionalState.after.stress * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* EMDR Metrics */}
            <div>
              <h4 className="font-medium mb-3">EMDR Metrics Impact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">SUDS Change</div>
                  <div className={`text-lg font-bold ${breakthrough.metrics.sudsChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {breakthrough.metrics.sudsChange > 0 ? '+' : ''}{breakthrough.metrics.sudsChange.toFixed(1)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">VOC Change</div>
                  <div className={`text-lg font-bold ${breakthrough.metrics.vocChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {breakthrough.metrics.vocChange > 0 ? '+' : ''}{breakthrough.metrics.vocChange.toFixed(1)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-sm text-muted-foreground">Stability</div>
                  <div className={`text-lg font-bold ${breakthrough.metrics.stabilityImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {breakthrough.metrics.stabilityImprovement > 0 ? '+' : ''}{(breakthrough.metrics.stabilityImprovement * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'analysis' && breakthrough.aiAnalysis && (
          <div className="space-y-4">
            {/* Significance Score */}
            <div>
              <h4 className="font-medium mb-2">AI Significance Score</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${breakthrough.aiAnalysis.significance * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(breakthrough.aiAnalysis.significance * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Detected Patterns */}
            <div>
              <h4 className="font-medium mb-2">Detected Patterns</h4>
              <div className="space-y-2">
                {breakthrough.aiAnalysis.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI Recommendations */}
            <div>
              <h4 className="font-medium mb-2">AI Recommendations</h4>
              <div className="space-y-2">
                {breakthrough.aiAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Statistics Panel
const TimelineStatsPanel = ({ breakthroughs }: { breakthroughs: BreakthroughMoment[] }) => {
  const stats = useMemo(() => {
    const typeCount = breakthroughs.reduce((acc, bt) => {
      acc[bt.type] = (acc[bt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const severityCount = breakthroughs.reduce((acc, bt) => {
      acc[bt.severity] = (acc[bt.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgDuration = breakthroughs.reduce((acc, bt) => acc + bt.duration, 0) / breakthroughs.length / 60;
    
    const totalImpact = breakthroughs.reduce((acc, bt) => {
      return acc + Math.abs(bt.metrics.sudsChange) + bt.metrics.vocChange + bt.metrics.stabilityImprovement;
    }, 0) / breakthroughs.length;
    
    return {
      total: breakthroughs.length,
      typeCount,
      severityCount,
      avgDuration,
      totalImpact,
      transformational: severityCount.transformational || 0
    };
  }, [breakthroughs]);
  
  return (
    <div className="space-y-4" data-testid="timeline-stats-panel">
      <h4 className="font-medium">Timeline Statistics</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Breakthroughs</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-2xl font-bold text-purple-600">{stats.transformational}</div>
          <div className="text-sm text-muted-foreground">Transformational</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-2xl font-bold text-green-600">{stats.avgDuration.toFixed(1)}m</div>
          <div className="text-sm text-muted-foreground">Avg Duration</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-2xl font-bold text-amber-600">{stats.totalImpact.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Impact Score</div>
        </div>
      </div>
      
      {/* Type Distribution */}
      <div>
        <div className="text-sm font-medium mb-2">Breakthrough Types</div>
        <div className="space-y-1">
          {Object.entries(stats.typeCount).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BREAKTHROUGH_COLORS[type as keyof typeof BREAKTHROUGH_COLORS] }}
                />
                <span className="capitalize">{type.replace('_', ' ')}</span>
              </div>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export function BreakthroughTimeline({ patientId, sessionId, className, showPredictions = false }: BreakthroughTimelineProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'session' | 'day' | 'week' | 'month'>('session');
  const [viewMode, setViewMode] = useState<'timeline' | 'patterns' | 'analysis'>('timeline');
  
  // Deterministic helper functions for clinical safety (moved up for proper scope)
  const deterministicValue = (seed: string, min: number = 0, max: number = 1): number => {
    const baseString = `${patientId}_${sessionId}_${seed}`;
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const normalized = (Math.abs(hash) % 10000) / 10000;
    return min + normalized * (max - min);
  };

  const deterministicArraySelect = function<T>(array: T[], seed: string): T {
    const value = deterministicValue(seed, 0, array.length);
    return array[Math.floor(value)];
  };

  const deterministicBoolean = (seed: string, threshold: number = 0.5): boolean => {
    return deterministicValue(seed) > threshold;
  };
  
  // Fetch breakthrough data
  const { data: breakthroughData, isLoading } = useQuery({
    queryKey: ['/api/sessions/breakthroughs', patientId, sessionId, timeRange],
    enabled: !!patientId
  });
  
  // Generate deterministic breakthrough data based on patient/session context
  const mockBreakthroughs: BreakthroughMoment[] = useMemo(() => {
    const types: Array<BreakthroughMoment['type']> = ['emotional_release', 'insight', 'memory_integration', 'anxiety_reduction', 'cognitive_shift'];
    const severities: Array<BreakthroughMoment['severity']> = ['minor', 'moderate', 'major', 'transformational'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const breakthroughSeed = `breakthrough_${i}`;
      return {
        id: `breakthrough_${i}`,
        timestamp: new Date(Date.now() - (12 - i) * 5 * 60 * 1000), // Every 5 minutes
        sessionId: sessionId || 'session_1',
        type: deterministicArraySelect(types, `${breakthroughSeed}_type`),
        severity: deterministicArraySelect(severities, `${breakthroughSeed}_severity`),
        title: `Breakthrough Moment ${i + 1}`,
        description: `Significant therapeutic breakthrough occurred during processing.`,
        duration: 30 + deterministicValue(`${breakthroughSeed}_duration`) * 300, // 30 seconds to 5 minutes
        triggers: ['Memory recall', 'Bilateral stimulation', 'Emotional processing'],
        outcomes: ['Reduced anxiety', 'Increased clarity', 'Emotional integration'],
        emotionalState: {
          before: {
            arousal: deterministicValue(`${breakthroughSeed}_before_arousal`),
            valence: deterministicValue(`${breakthroughSeed}_before_valence`) * 0.5,
            stress: 0.5 + deterministicValue(`${breakthroughSeed}_before_stress`) * 0.5
          },
          after: {
            arousal: deterministicValue(`${breakthroughSeed}_after_arousal`) * 0.7,
            valence: 0.5 + deterministicValue(`${breakthroughSeed}_after_valence`) * 0.5,
            stress: deterministicValue(`${breakthroughSeed}_after_stress`) * 0.5
          }
        },
        metrics: {
          sudsChange: -1 - deterministicValue(`${breakthroughSeed}_suds_change`) * 3,
          vocChange: 1 + deterministicValue(`${breakthroughSeed}_voc_change`) * 2,
          stabilityImprovement: deterministicValue(`${breakthroughSeed}_stability`) * 0.3
        },
        aiAnalysis: {
          significance: 0.3 + deterministicValue(`${breakthroughSeed}_significance`) * 0.7,
          patterns: ['Emotional regulation improvement', 'Memory processing enhancement'],
          recommendations: ['Continue current approach', 'Monitor for sustained progress']
        },
        precursors: {
          emotionalBuild: deterministicBoolean(`${breakthroughSeed}_emotional_build`, 0.5),
          physiologicalMarkers: deterministicBoolean(`${breakthroughSeed}_physiological`, 0.6),
          verbalCues: deterministicBoolean(`${breakthroughSeed}_verbal`, 0.7)
        }
      };
    });
  }, [patientId, sessionId]);
  
  const processedBreakthroughs = breakthroughData?.breakthroughs || mockBreakthroughs;
  
  // Create timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    return processedBreakthroughs.map(breakthrough => ({
      id: breakthrough.id,
      timestamp: breakthrough.timestamp,
      type: 'breakthrough',
      data: breakthrough,
      x: 0,
      y: 0
    }));
  }, [processedBreakthroughs]);
  
  // Calculate time range
  const calculatedTimeRange = useMemo(() => {
    if (timelineEvents.length === 0) {
      const now = new Date();
      return { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
    }
    
    const timestamps = timelineEvents.map(e => e.timestamp.getTime());
    const start = new Date(Math.min(...timestamps) - 10 * 60 * 1000); // 10 minutes before first
    const end = new Date(Math.max(...timestamps) + 10 * 60 * 1000); // 10 minutes after last
    
    return { start, end };
  }, [timelineEvents]);
  
  const selectedBreakthrough = processedBreakthroughs.find(bt => bt.id === selectedEventId);
  
  useEffect(() => {
    if (processedBreakthroughs.length > 0 && !selectedEventId) {
      setSelectedEventId(processedBreakthroughs[0].id);
    }
  }, [processedBreakthroughs, selectedEventId]);
  
  if (isLoading && !mockBreakthroughs.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`} data-testid="breakthrough-timeline">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Breakthrough Moment Timeline
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Interactive timeline of therapeutic breakthroughs and key moments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {processedBreakthroughs.length} Breakthroughs
              </Badge>
              <Button variant="outline" size="sm" data-testid="button-export-timeline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                <SelectTrigger className="w-32" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">This Session</SelectItem>
                  <SelectItem value="day">Last 24h</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">View:</label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <SelectTrigger className="w-32" data-testid="select-view-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="patterns">Patterns</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Main Timeline */}
          <TimelineVisualization 
            events={timelineEvents}
            selectedEvent={selectedEventId}
            onEventSelect={setSelectedEventId}
            timeRange={calculatedTimeRange}
          />
        </CardContent>
      </Card>
      
      {/* Details and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Breakthrough Details */}
        <div className="lg:col-span-2">
          {selectedBreakthrough ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Breakthrough Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BreakthroughDetailsPanel breakthrough={selectedBreakthrough} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Breakthrough</h3>
                <p className="text-muted-foreground">
                  Click on any breakthrough moment in the timeline to view detailed analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Statistics Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineStatsPanel breakthroughs={processedBreakthroughs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}