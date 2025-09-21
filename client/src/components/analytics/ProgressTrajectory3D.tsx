/**
 * Revolutionary 3D Progress Trajectories
 * Three-dimensional visualization of therapeutic progress over time
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  RotateCcw, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut,
  Download,
  Eye,
  Layers,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { deterministicValue, deterministicArraySelect, deterministicBoolean } from '@/lib/deterministicUtils';

interface ProgressTrajectory3DProps {
  patientId: string;
  className?: string;
  showPredictions?: boolean;
}

interface ProgressPoint {
  timestamp: Date;
  sudsLevel: number;
  vocLevel: number;
  stabilityScore: number;
  stressLevel: number;
  engagementLevel: number;
  sessionId: string;
  phaseContext: string;
  breakthroughMoment?: boolean;
}

interface TrajectoryConfig {
  xAxis: 'time' | 'sessions' | 'phases';
  yAxis: 'suds' | 'voc' | 'stability' | 'stress' | 'engagement';
  zAxis: 'suds' | 'voc' | 'stability' | 'stress' | 'engagement';
  colorBy: 'phase' | 'effectiveness' | 'breakthrough' | 'trend';
  showPredicted: boolean;
  animationSpeed: number;
}

// 3D Visualization Component using Canvas and WebGL-like rendering
const Trajectory3DVisualization = ({ 
  data, 
  config, 
  width = 600, 
  height = 400 
}: {
  data: ProgressPoint[];
  config: TrajectoryConfig;
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationX, setRotationX] = useState(30);
  const [rotationY, setRotationY] = useState(45);
  const [zoom, setZoom] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  
  // Transform data to 3D coordinates
  const transformedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const getAxisValue = (point: ProgressPoint, axis: string) => {
      switch (axis) {
        case 'time': return point.timestamp.getTime();
        case 'sessions': return data.indexOf(point);
        case 'suds': return point.sudsLevel;
        case 'voc': return point.vocLevel;
        case 'stability': return point.stabilityScore;
        case 'stress': return point.stressLevel;
        case 'engagement': return point.engagementLevel;
        default: return 0;
      }
    };
    
    const normalize = (value: number, min: number, max: number) => {
      return (value - min) / (max - min);
    };
    
    // Get min/max for normalization
    const xValues = data.map(p => getAxisValue(p, config.xAxis));
    const yValues = data.map(p => getAxisValue(p, config.yAxis));
    const zValues = data.map(p => getAxisValue(p, config.zAxis));
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);
    
    return data.map((point, index) => ({
      x: normalize(getAxisValue(point, config.xAxis), xMin, xMax) * 200 - 100,
      y: normalize(getAxisValue(point, config.yAxis), yMin, yMax) * 200 - 100,
      z: normalize(getAxisValue(point, config.zAxis), zMin, zMax) * 200 - 100,
      point,
      index,
      color: getPointColor(point, config.colorBy)
    }));
  }, [data, config]);
  
  // Get color based on configuration
  const getPointColor = (point: ProgressPoint, colorBy: string): string => {
    switch (colorBy) {
      case 'phase':
        const phaseColors: Record<string, string> = {
          preparation: '#3b82f6',
          assessment: '#f59e0b',
          desensitization: '#ef4444',
          installation: '#10b981',
          body_scan: '#8b5cf6',
          closure: '#06b6d4'
        };
        return phaseColors[point.phaseContext] || '#6b7280';
      case 'effectiveness':
        const effectiveness = (point.vocLevel - point.sudsLevel) / 10;
        return effectiveness > 0.5 ? '#10b981' : effectiveness > 0 ? '#f59e0b' : '#ef4444';
      case 'breakthrough':
        return point.breakthroughMoment ? '#fbbf24' : '#6b7280';
      case 'trend':
        return point.stabilityScore > 0.7 ? '#10b981' : point.stabilityScore > 0.4 ? '#f59e0b' : '#ef4444';
      default:
        return '#6b7280';
    }
  };
  
  // 3D projection with rotation
  const project3D = (x: number, y: number, z: number) => {
    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;
    
    // Rotate around X axis
    const y1 = y * Math.cos(radX) - z * Math.sin(radX);
    const z1 = y * Math.sin(radX) + z * Math.cos(radX);
    
    // Rotate around Y axis
    const x2 = x * Math.cos(radY) + z1 * Math.sin(radY);
    const z2 = -x * Math.sin(radY) + z1 * Math.cos(radY);
    
    // Project to 2D
    const perspective = 400;
    const scale = perspective / (perspective + z2) * zoom;
    
    return {
      x: width / 2 + x2 * scale,
      y: height / 2 + y1 * scale,
      scale
    };
  };
  
  // Draw the 3D visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw axes
    drawAxes(ctx);
    
    // Draw trajectory line
    drawTrajectoryLine(ctx);
    
    // Draw data points
    drawDataPoints(ctx);
    
    // Draw labels
    drawLabels(ctx);
  }, [transformedData, rotationX, rotationY, zoom, width, height]);
  
  const drawAxes = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // X axis
    const xStart = project3D(-100, 0, 0);
    const xEnd = project3D(100, 0, 0);
    ctx.beginPath();
    ctx.moveTo(xStart.x, xStart.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    
    // Y axis
    const yStart = project3D(0, -100, 0);
    const yEnd = project3D(0, 100, 0);
    ctx.beginPath();
    ctx.moveTo(yStart.x, yStart.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();
    
    // Z axis
    const zStart = project3D(0, 0, -100);
    const zEnd = project3D(0, 0, 100);
    ctx.beginPath();
    ctx.moveTo(zStart.x, zStart.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();
  };
  
  const drawTrajectoryLine = (ctx: CanvasRenderingContext2D) => {
    if (transformedData.length < 2) return;
    
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    transformedData.forEach((point, index) => {
      const projected = project3D(point.x, point.y, point.z);
      if (index === 0) {
        ctx.moveTo(projected.x, projected.y);
      } else {
        ctx.lineTo(projected.x, projected.y);
      }
    });
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  };
  
  const drawDataPoints = (ctx: CanvasRenderingContext2D) => {
    transformedData.forEach((point) => {
      const projected = project3D(point.x, point.y, point.z);
      const radius = Math.max(2, 6 * projected.scale);
      
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Highlight breakthrough moments
      if (point.point.breakthroughMoment) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radius + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };
  
  const drawLabels = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    
    // Axis labels
    const xLabel = project3D(120, 0, 0);
    ctx.fillText(config.xAxis.toUpperCase(), xLabel.x, xLabel.y);
    
    const yLabel = project3D(0, 120, 0);
    ctx.fillText(config.yAxis.toUpperCase(), yLabel.x, yLabel.y);
    
    const zLabel = project3D(0, 0, 120);
    ctx.fillText(config.zAxis.toUpperCase(), zLabel.x, zLabel.y);
  };
  
  // Auto-rotation effect
  useEffect(() => {
    if (!isRotating) return;
    
    const interval = setInterval(() => {
      setRotationY(prev => (prev + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isRotating]);
  
  return (
    <div className="relative" data-testid="trajectory-3d-visualization">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded cursor-move"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startY = e.clientY;
          const startRotX = rotationX;
          const startRotY = rotationY;
          
          const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            setRotationY(startRotY + deltaX * 0.5);
            setRotationX(Math.max(-90, Math.min(90, startRotX + deltaY * 0.5)));
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        data-testid="trajectory-canvas"
      />
      
      {/* 3D Controls */}
      <div className="absolute top-2 right-2 space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRotating(!isRotating)}
          data-testid="button-auto-rotate"
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRotationX(30);
            setRotationY(45);
            setZoom(1);
          }}
          data-testid="button-reset-view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded p-2 text-xs">
        <div className="font-medium mb-1">Color Legend</div>
        {config.colorBy === 'phase' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Preparation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Desensitization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Installation</span>
            </div>
          </div>
        )}
        {config.colorBy === 'effectiveness' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>High Effectiveness</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Low Effectiveness</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Trajectory Statistics Panel
const TrajectoryStats = ({ data }: { data: ProgressPoint[] }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const latest = data[data.length - 1];
    const earliest = data[0];
    
    const sudsImprovement = earliest.sudsLevel - latest.sudsLevel;
    const vocImprovement = latest.vocLevel - earliest.vocLevel;
    const stabilityImprovement = latest.stabilityScore - earliest.stabilityScore;
    
    const breakthroughCount = data.filter(p => p.breakthroughMoment).length;
    const totalSessions = new Set(data.map(p => p.sessionId)).size;
    
    return {
      sudsImprovement,
      vocImprovement,
      stabilityImprovement,
      breakthroughCount,
      totalSessions,
      currentStability: latest.stabilityScore,
      currentStress: latest.stressLevel
    };
  }, [data]);
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="trajectory-stats">
      <div className="text-center p-3 bg-muted/50 rounded">
        <div className="text-2xl font-bold text-green-600">
          {stats.sudsImprovement > 0 ? '-' : '+'}{Math.abs(stats.sudsImprovement).toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground">SUDS Change</div>
      </div>
      
      <div className="text-center p-3 bg-muted/50 rounded">
        <div className="text-2xl font-bold text-blue-600">
          {stats.vocImprovement > 0 ? '+' : ''}{stats.vocImprovement.toFixed(1)}
        </div>
        <div className="text-sm text-muted-foreground">VOC Change</div>
      </div>
      
      <div className="text-center p-3 bg-muted/50 rounded">
        <div className="text-2xl font-bold text-purple-600">
          {stats.breakthroughCount}
        </div>
        <div className="text-sm text-muted-foreground">Breakthroughs</div>
      </div>
      
      <div className="text-center p-3 bg-muted/50 rounded">
        <div className="text-2xl font-bold text-cyan-600">
          {Math.round(stats.currentStability * 100)}%
        </div>
        <div className="text-sm text-muted-foreground">Current Stability</div>
      </div>
    </div>
  );
};

export function ProgressTrajectory3D({ patientId, className, showPredictions = false }: ProgressTrajectory3DProps) {
  const [config, setConfig] = useState<TrajectoryConfig>({
    xAxis: 'time',
    yAxis: 'suds',
    zAxis: 'voc',
    colorBy: 'phase',
    showPredicted: showPredictions,
    animationSpeed: 1
  });
  
  // Fetch progress data
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/sessions/progress/trajectory', patientId],
    enabled: !!patientId
  });
  
  // Generate mock data for demonstration
  const mockProgressData: ProgressPoint[] = useMemo(() => {
    const data: ProgressPoint[] = [];
    const sessions = ['session1', 'session2', 'session3', 'session4', 'session5'];
    const phases = ['preparation', 'assessment', 'desensitization', 'installation', 'closure'];
    
    for (let i = 0; i < 25; i++) {
      const progress = i / 24;
      data.push({
        timestamp: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
        sudsLevel: 8 - (progress * 6) + deterministicValue(patientId || 'patient_demo', 'session_1', `suds_${i}`) * 2,
        vocLevel: 2 + (progress * 6) + deterministicValue(patientId || 'patient_demo', 'session_1', `voc_${i}`) * 1,
        stabilityScore: Math.min(1, progress * 0.8 + deterministicValue(patientId || 'patient_demo', 'session_1', `stability_${i}`) * 0.3),
        stressLevel: Math.max(0, 0.8 - progress * 0.6 + deterministicValue(patientId || 'patient_demo', 'session_1', `stress_${i}`) * 0.2),
        engagementLevel: Math.min(1, 0.3 + progress * 0.6 + deterministicValue(patientId || 'patient_demo', 'session_1', `engagement_${i}`) * 0.2),
        sessionId: deterministicArraySelect(sessions, patientId || 'patient_demo', 'session_1', `session_${i}`),
        phaseContext: deterministicArraySelect(phases, patientId || 'patient_demo', 'session_1', `phase_${i}`),
        breakthroughMoment: deterministicBoolean(patientId || 'patient_demo', 'session_1', `breakthrough_${i}`, 0.85) && progress > 0.3
      });
    }
    
    return data;
  }, []);
  
  const processedData = progressData?.data || mockProgressData;
  
  if (isLoading && !mockProgressData.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`} data-testid="progress-trajectory-3d">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-500" />
                3D Progress Trajectories
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Three-dimensional visualization of therapeutic progress over time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Multi-Dimensional
              </Badge>
              <Button variant="outline" size="sm" data-testid="button-export-trajectory">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Configuration Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">X-Axis</label>
              <Select value={config.xAxis} onValueChange={(value) => setConfig(prev => ({ ...prev, xAxis: value as any }))}>
                <SelectTrigger data-testid="select-x-axis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="phases">Phases</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Y-Axis</label>
              <Select value={config.yAxis} onValueChange={(value) => setConfig(prev => ({ ...prev, yAxis: value as any }))}>
                <SelectTrigger data-testid="select-y-axis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suds">SUDS Level</SelectItem>
                  <SelectItem value="voc">VOC Level</SelectItem>
                  <SelectItem value="stability">Stability</SelectItem>
                  <SelectItem value="stress">Stress</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Z-Axis</label>
              <Select value={config.zAxis} onValueChange={(value) => setConfig(prev => ({ ...prev, zAxis: value as any }))}>
                <SelectTrigger data-testid="select-z-axis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suds">SUDS Level</SelectItem>
                  <SelectItem value="voc">VOC Level</SelectItem>
                  <SelectItem value="stability">Stability</SelectItem>
                  <SelectItem value="stress">Stress</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Color By</label>
              <Select value={config.colorBy} onValueChange={(value) => setConfig(prev => ({ ...prev, colorBy: value as any }))}>
                <SelectTrigger data-testid="select-color-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase">EMDR Phase</SelectItem>
                  <SelectItem value="effectiveness">Effectiveness</SelectItem>
                  <SelectItem value="breakthrough">Breakthroughs</SelectItem>
                  <SelectItem value="trend">Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Main 3D Visualization */}
          <div className="mb-6">
            <Trajectory3DVisualization data={processedData} config={config} width={800} height={500} />
          </div>
        </CardContent>
      </Card>
      
      {/* Progress Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Trajectory Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrajectoryStats data={processedData} />
        </CardContent>
      </Card>
    </div>
  );
}