/**
 * Revolutionary Real-time Emotion Heatmap
 * Advanced visualization of emotional states across time and intensity
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { 
  Thermometer, 
  Activity, 
  Brain, 
  Heart, 
  Zap,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { generateDeterministicEmotionData } from '@/lib/deterministicUtils';

interface EmotionHeatmapProps {
  patientId: string;
  sessionId?: string;
  realTime?: boolean;
  className?: string;
}

interface EmotionDataPoint {
  timestamp: Date;
  arousal: number;
  valence: number;
  basicEmotions: Record<string, number>;
  affects: Record<string, number>;
  stressLevel: number;
  stabilityScore: number;
}

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
  emotion: string;
  timestamp: Date;
  color: string;
}

// Color intensity mapping for emotions
const EMOTION_COLORS = {
  anger: '#ef4444',
  fear: '#8b5cf6',
  sadness: '#3b82f6',
  joy: '#10b981',
  surprise: '#f59e0b',
  disgust: '#84cc16',
  anxiety: '#dc2626',
  calm: '#06b6d4',
  stress: '#f97316',
  relief: '#22c55e'
};

// Helper function to generate heatmap data
const generateHeatmapData = (emotionData: EmotionDataPoint[]): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];
  const emotions = Object.keys(EMOTION_COLORS);
  
  emotionData.forEach((dataPoint, timeIndex) => {
    emotions.forEach((emotion, emotionIndex) => {
      const intensity = dataPoint.basicEmotions[emotion] || 0;
      const cell: HeatmapCell = {
        x: timeIndex,
        y: emotionIndex,
        intensity,
        emotion,
        timestamp: dataPoint.timestamp,
        color: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]
      };
      cells.push(cell);
    });
  });
  
  return cells;
};

// Advanced Heatmap Visualization Component
const HeatmapVisualization = ({ data, width = 800, height = 400 }: {
  data: HeatmapCell[];
  width?: number;
  height?: number;
}) => {
  const emotions = Object.keys(EMOTION_COLORS);
  const timePoints = [...new Set(data.map(d => d.x))];
  
  const cellWidth = width / timePoints.length;
  const cellHeight = height / emotions.length;
  
  return (
    <div className="relative" data-testid="emotion-heatmap-visualization">
      <svg width={width} height={height} className="border rounded">
        {/* Heatmap cells */}
        {data.map((cell, index) => (
          <rect
            key={index}
            x={cell.x * cellWidth}
            y={cell.y * cellHeight}
            width={cellWidth}
            height={cellHeight}
            fill={cell.color}
            fillOpacity={cell.intensity / 100}
            stroke="#ffffff"
            strokeWidth={0.5}
            className="hover:stroke-2 cursor-pointer transition-all"
            data-testid={`heatmap-cell-${cell.emotion}-${cell.x}`}
          >
            <title>
              {cell.emotion}: {cell.intensity.toFixed(1)}% at {format(cell.timestamp, 'HH:mm:ss')}
            </title>
          </rect>
        ))}
        
        {/* Emotion labels */}
        {emotions.map((emotion, index) => (
          <text
            key={emotion}
            x={-10}
            y={index * cellHeight + cellHeight / 2}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
            dominantBaseline="middle"
          >
            {emotion}
          </text>
        ))}
        
        {/* Time axis */}
        {timePoints.filter((_, i) => i % Math.ceil(timePoints.length / 10) === 0).map((timePoint, index) => (
          <text
            key={timePoint}
            x={timePoint * cellWidth + cellWidth / 2}
            y={height + 15}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {format(new Date(Date.now() - (timePoints.length - timePoint) * 1000), 'HH:mm')}
          </text>
        ))}
      </svg>
      
      {/* Color intensity legend */}
      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded p-2">
        <div className="text-xs text-muted-foreground mb-1">Intensity</div>
        <div className="flex items-center gap-1">
          <span className="text-xs">Low</span>
          <div className="w-16 h-2 bg-gradient-to-r from-transparent to-red-500 rounded"></div>
          <span className="text-xs">High</span>
        </div>
      </div>
    </div>
  );
};

// Real-time Emotion Tracker
const RealTimeEmotionTracker = ({ data }: { data: EmotionDataPoint[] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!isPlaying || currentIndex >= data.length - 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => Math.min(prev + 1, data.length - 1));
    }, 500); // Update every 500ms
    
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, data.length]);
  
  const currentData = data[currentIndex];
  
  if (!currentData) return null;
  
  return (
    <div className="space-y-4" data-testid="realtime-emotion-tracker">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(0)}
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          {format(currentData.timestamp, 'HH:mm:ss')}
        </Badge>
      </div>
      
      {/* Current emotion state display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-sm text-muted-foreground">Arousal</div>
          <div className="text-lg font-bold">{(currentData.arousal * 100).toFixed(1)}%</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-sm text-muted-foreground">Valence</div>
          <div className="text-lg font-bold">{(currentData.valence * 100).toFixed(1)}%</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-sm text-muted-foreground">Stress</div>
          <div className="text-lg font-bold">{(currentData.stressLevel * 100).toFixed(1)}%</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded">
          <div className="text-sm text-muted-foreground">Stability</div>
          <div className="text-lg font-bold">{(currentData.stabilityScore * 100).toFixed(1)}%</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / (data.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Emotion Pattern Analysis
const EmotionPatternAnalysis = ({ data }: { data: EmotionDataPoint[] }) => {
  const patterns = useMemo(() => {
    if (data.length < 5) return [];
    
    const patterns = [];
    
    // Find emotional spikes
    for (let i = 2; i < data.length - 2; i++) {
      const current = data[i];
      const prev = data[i - 1];
      const next = data[i + 1];
      
      // Detect stress spikes
      if (current.stressLevel > prev.stressLevel + 0.3 && current.stressLevel > 0.7) {
        patterns.push({
          type: 'stress_spike',
          timestamp: current.timestamp,
          intensity: current.stressLevel,
          description: 'Sudden stress elevation detected'
        });
      }
      
      // Detect emotional breakthroughs (high positive emotions)
      const positiveEmotions = current.basicEmotions.joy + current.basicEmotions.calm;
      if (positiveEmotions > 150 && current.stabilityScore > 0.8) {
        patterns.push({
          type: 'breakthrough',
          timestamp: current.timestamp,
          intensity: positiveEmotions,
          description: 'Positive emotional breakthrough detected'
        });
      }
    }
    
    return patterns;
  }, [data]);
  
  return (
    <div className="space-y-3" data-testid="emotion-pattern-analysis">
      <h4 className="font-medium">Detected Patterns</h4>
      {patterns.length === 0 ? (
        <p className="text-muted-foreground text-sm">No significant patterns detected in current timeframe.</p>
      ) : (
        patterns.map((pattern, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              pattern.type === 'breakthrough' ? 'bg-green-500' : 
              pattern.type === 'stress_spike' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <div>
              <div className="font-medium text-sm">
                {pattern.type === 'breakthrough' ? 'Breakthrough' : 
                 pattern.type === 'stress_spike' ? 'Stress Spike' : 'Pattern'}
              </div>
              <div className="text-sm text-muted-foreground">{pattern.description}</div>
              <div className="text-xs text-muted-foreground">
                {format(pattern.timestamp, 'HH:mm:ss')} - Intensity: {pattern.intensity.toFixed(1)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export function EmotionHeatmap({ patientId, sessionId, realTime = false, className }: EmotionHeatmapProps) {
  const [timeRange, setTimeRange] = useState('session');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  
  // Fetch emotion data
  const { data: emotionData, isLoading } = useQuery({
    queryKey: ['/api/sessions/emotions/heatmap', patientId, sessionId, timeRange],
    refetchInterval: realTime ? 1000 : false // Refresh every second if real-time
  });
  
  // Generate mock data for demonstration
  const mockEmotionData: EmotionDataPoint[] = useMemo(() => {
    const data: EmotionDataPoint[] = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (50 - i) * 1000);
      const emotionData = generateDeterministicEmotionData(patientId, sessionId || 'session_1', i);
      data.push({
        timestamp,
        arousal: emotionData.arousal,
        valence: emotionData.valence,
        basicEmotions: emotionData.basicEmotions,
        affects: {},
        stressLevel: emotionData.stressLevel,
        stabilityScore: emotionData.stabilityScore
      });
    }
    
    return data;
  }, []);
  
  const processedData = emotionData?.data || mockEmotionData;
  const heatmapData = generateHeatmapData(processedData);
  
  if (isLoading && !mockEmotionData.length) {
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
    <div className={`space-y-6 ${className}`} data-testid="emotion-heatmap">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-red-500" />
                Real-time Emotion Heatmap
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Advanced visualization of emotional states and patterns
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={realTime ? "default" : "outline"} className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {realTime ? 'Live' : 'Historical'}
              </Badge>
              <Button variant="outline" size="sm" data-testid="button-export-heatmap">
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
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">This Session</SelectItem>
                  <SelectItem value="hour">Last Hour</SelectItem>
                  <SelectItem value="day">Last 24h</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Focus Emotion:</label>
              <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                <SelectTrigger className="w-32" data-testid="select-emotion-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emotions</SelectItem>
                  {Object.keys(EMOTION_COLORS).map(emotion => (
                    <SelectItem key={emotion} value={emotion}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Main Heatmap */}
          <div className="mb-6">
            <HeatmapVisualization data={heatmapData} width={800} height={300} />
          </div>
        </CardContent>
      </Card>
      
      {/* Real-time Tracker */}
      {realTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Live Emotion Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeEmotionTracker data={processedData} />
          </CardContent>
        </Card>
      )}
      
      {/* Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Emotion Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmotionPatternAnalysis data={processedData} />
        </CardContent>
      </Card>
    </div>
  );
}