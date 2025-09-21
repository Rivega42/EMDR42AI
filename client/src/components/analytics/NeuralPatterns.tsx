/**
 * Revolutionary Neural Network Patterns Visualization
 * Advanced visualization of neural patterns and brain activity correlations during EMDR therapy
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Brain, 
  Activity, 
  Zap, 
  Network,
  Eye,
  Waves,
  Download,
  Play,
  Pause,
  RotateCcw,
  Target,
  TrendingUp,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { deterministicValue, generateDeterministicNeuralActivity } from '@/lib/deterministicUtils';

interface NeuralPatternsProps {
  patientId: string;
  sessionId?: string;
  realTime?: boolean;
  className?: string;
}

interface NeuralNode {
  id: string;
  x: number;
  y: number;
  region: string;
  activity: number;
  connections: string[];
  size: number;
  color: string;
}

interface NeuralConnection {
  from: string;
  to: string;
  strength: number;
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  active: boolean;
}

interface BrainWave {
  frequency: number;
  amplitude: number;
  type: 'alpha' | 'beta' | 'theta' | 'delta' | 'gamma';
  timestamp: Date;
}

interface NeuralPattern {
  id: string;
  name: string;
  nodes: NeuralNode[];
  connections: NeuralConnection[];
  activity: number;
  coherence: number;
  timestamp: Date;
}

// Brain regions configuration
const BRAIN_REGIONS = {
  prefrontal: { name: 'Prefrontal Cortex', color: '#3b82f6', x: 300, y: 150 },
  amygdala: { name: 'Amygdala', color: '#ef4444', x: 250, y: 300 },
  hippocampus: { name: 'Hippocampus', color: '#10b981', x: 350, y: 320 },
  insula: { name: 'Insula', color: '#f59e0b', x: 200, y: 250 },
  cingulate: { name: 'Anterior Cingulate', color: '#8b5cf6', x: 300, y: 200 },
  thalamus: { name: 'Thalamus', color: '#06b6d4', x: 300, y: 280 },
  brainstem: { name: 'Brainstem', color: '#84cc16', x: 300, y: 380 },
  cerebellum: { name: 'Cerebellum', color: '#f97316', x: 400, y: 350 }
};

// Neural Network Visualization Component
const NeuralNetworkVisualization = ({ 
  pattern, 
  showConnections = true, 
  animated = false,
  width = 600, 
  height = 400 
}: {
  pattern: NeuralPattern;
  showConnections?: boolean;
  animated?: boolean;
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulsePhase, setPulsePhase] = useState(0);
  
  // Animation loop
  useEffect(() => {
    if (!animated) return;
    
    const animate = () => {
      setPulsePhase(prev => (prev + 0.05) % (Math.PI * 2));
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animated]);
  
  // Draw neural network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections first (so they appear behind nodes)
    if (showConnections) {
      drawConnections(ctx, pattern);
    }
    
    // Draw nodes
    drawNodes(ctx, pattern);
    
    // Draw activity pulses if animated
    if (animated) {
      drawActivityPulses(ctx, pattern);
    }
    
    // Draw labels
    drawLabels(ctx, pattern);
  }, [pattern, showConnections, animated, pulsePhase, width, height]);
  
  const drawConnections = (ctx: CanvasRenderingContext2D, pattern: NeuralPattern) => {
    pattern.connections.forEach(connection => {
      const fromNode = pattern.nodes.find(n => n.id === connection.from);
      const toNode = pattern.nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;
      
      const opacity = connection.active ? connection.strength : connection.strength * 0.3;
      
      // Set connection style
      ctx.strokeStyle = connection.type === 'excitatory' ? '#10b981' : 
                       connection.type === 'inhibitory' ? '#ef4444' : '#f59e0b';
      ctx.globalAlpha = opacity;
      ctx.lineWidth = Math.max(1, connection.strength * 5);
      
      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      
      // Draw arrow head for active connections
      if (connection.active) {
        drawArrowHead(ctx, fromNode, toNode);
      }
    });
    
    ctx.globalAlpha = 1;
  };
  
  const drawArrowHead = (ctx: CanvasRenderingContext2D, from: NeuralNode, to: NeuralNode) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    const arrowX = to.x - Math.cos(angle) * to.size;
    const arrowY = to.y - Math.sin(angle) * to.size;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle - arrowAngle),
      arrowY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle + arrowAngle),
      arrowY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };
  
  const drawNodes = (ctx: CanvasRenderingContext2D, pattern: NeuralPattern) => {
    pattern.nodes.forEach(node => {
      const radius = node.size + (animated ? Math.sin(pulsePhase) * 3 : 0);
      
      // Draw node circle
      ctx.fillStyle = node.color;
      ctx.globalAlpha = 0.1 + node.activity * 0.9;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw node border
      ctx.strokeStyle = node.color;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw activity indicator
      if (node.activity > 0.7) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    ctx.globalAlpha = 1;
  };
  
  const drawActivityPulses = (ctx: CanvasRenderingContext2D, pattern: NeuralPattern) => {
    pattern.nodes.forEach(node => {
      if (node.activity > 0.5) {
        const pulseRadius = node.size + Math.sin(pulsePhase + node.activity * Math.PI) * 10;
        
        ctx.strokeStyle = node.color;
        ctx.globalAlpha = 0.3 * node.activity;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    
    ctx.globalAlpha = 1;
  };
  
  const drawLabels = (ctx: CanvasRenderingContext2D, pattern: NeuralPattern) => {
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    pattern.nodes.forEach(node => {
      ctx.fillText(node.region, node.x, node.y + node.size + 15);
    });
  };
  
  return (
    <div className="relative" data-testid="neural-network-visualization">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded bg-gradient-to-br from-slate-50 to-slate-100"
        data-testid="neural-canvas"
      />
      
      {/* Network Statistics Overlay */}
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded p-2 text-xs">
        <div className="font-medium mb-1">Network Stats</div>
        <div>Activity: {(pattern.activity * 100).toFixed(1)}%</div>
        <div>Coherence: {(pattern.coherence * 100).toFixed(1)}%</div>
        <div>Nodes: {pattern.nodes.length}</div>
        <div>Connections: {pattern.connections.length}</div>
      </div>
    </div>
  );
};

// Brainwave Visualization Component
const BrainwaveVisualization = ({ 
  waves, 
  width = 600, 
  height = 200 
}: {
  waves: BrainWave[];
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw brainwave types
    const waveTypes = ['alpha', 'beta', 'theta', 'delta', 'gamma'];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    waveTypes.forEach((type, index) => {
      const typeWaves = waves.filter(w => w.type === type);
      if (typeWaves.length === 0) return;
      
      const y = (height / waveTypes.length) * (index + 0.5);
      
      ctx.strokeStyle = colors[index];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      typeWaves.forEach((wave, waveIndex) => {
        const x = (width / typeWaves.length) * waveIndex;
        const amplitude = wave.amplitude * 30;
        const frequency = wave.frequency * 0.1;
        
        if (waveIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y + Math.sin(frequency) * amplitude);
        }
      });
      
      ctx.stroke();
      
      // Draw wave type label
      ctx.fillStyle = colors[index];
      ctx.font = '12px sans-serif';
      ctx.fillText(type.toUpperCase(), 10, y - 20);
    });
  }, [waves, width, height]);
  
  return (
    <div className="relative" data-testid="brainwave-visualization">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded"
      />
    </div>
  );
};

// Neural Activity Timeline
const NeuralActivityTimeline = ({ 
  patterns, 
  selectedPattern, 
  onPatternSelect 
}: {
  patterns: NeuralPattern[];
  selectedPattern?: string;
  onPatternSelect: (patternId: string) => void;
}) => {
  return (
    <div className="space-y-2" data-testid="neural-activity-timeline">
      <h4 className="font-medium">Neural Activity Timeline</h4>
      <div className="h-24 overflow-y-auto space-y-1">
        {patterns.map((pattern, index) => (
          <div 
            key={pattern.id}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
              selectedPattern === pattern.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 hover:bg-muted'
            }`}
            onClick={() => onPatternSelect(pattern.id)}
            data-testid={`timeline-pattern-${pattern.id}`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{pattern.name}</div>
              <div className="text-xs text-muted-foreground">
                {format(pattern.timestamp, 'HH:mm:ss')} - Activity: {(pattern.activity * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {(pattern.coherence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pattern Analysis Panel
const PatternAnalysisPanel = ({ pattern }: { pattern: NeuralPattern }) => {
  const analysis = useMemo(() => {
    const highActivityNodes = pattern.nodes.filter(n => n.activity > 0.7);
    const activeConnections = pattern.connections.filter(c => c.active);
    const strongConnections = pattern.connections.filter(c => c.strength > 0.7);
    
    const dominantRegions = highActivityNodes.map(n => n.region);
    const networkEfficiency = pattern.coherence * pattern.activity;
    
    return {
      dominantRegions,
      highActivityCount: highActivityNodes.length,
      activeConnectionCount: activeConnections.length,
      strongConnectionCount: strongConnections.length,
      networkEfficiency,
      patternType: networkEfficiency > 0.7 ? 'Highly Integrated' : 
                   networkEfficiency > 0.4 ? 'Moderately Integrated' : 'Fragmented'
    };
  }, [pattern]);
  
  return (
    <div className="space-y-4" data-testid="pattern-analysis-panel">
      <h4 className="font-medium">Pattern Analysis</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Network Type</div>
          <Badge variant={analysis.networkEfficiency > 0.7 ? 'default' : 'secondary'}>
            {analysis.patternType}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Efficiency</div>
          <div className="text-2xl font-bold text-blue-600">
            {(analysis.networkEfficiency * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm font-medium">Dominant Regions</div>
        <div className="flex flex-wrap gap-1">
          {analysis.dominantRegions.map((region, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {region}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Active Nodes</div>
          <div className="font-medium">{analysis.highActivityCount}/{pattern.nodes.length}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Strong Connections</div>
          <div className="font-medium">{analysis.strongConnectionCount}/{pattern.connections.length}</div>
        </div>
      </div>
    </div>
  );
};

export function NeuralPatterns({ patientId, sessionId, realTime = false, className }: NeuralPatternsProps) {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('');
  const [showConnections, setShowConnections] = useState(true);
  const [animated, setAnimated] = useState(realTime);
  const [viewMode, setViewMode] = useState<'network' | 'waves' | 'both'>('network');
  
  // Fetch neural pattern data
  const { data: neuralData, isLoading } = useQuery({
    queryKey: ['/api/sessions/neural/patterns', patientId, sessionId],
    refetchInterval: realTime ? 2000 : false
  });
  
  // Generate mock neural patterns for demonstration
  const mockNeuralPatterns: NeuralPattern[] = useMemo(() => {
    const patterns: NeuralPattern[] = [];
    
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(Date.now() - (10 - i) * 10000);
      
      // Create nodes for each brain region
      const nodes: NeuralNode[] = Object.entries(BRAIN_REGIONS).map(([key, region]) => ({
        id: key,
        x: region.x,
        y: region.y,
        region: region.name,
        activity: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `neural_${key}_activity`),
        connections: [],
        size: 15 + deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `neural_${key}_size`, 0, 10),
        color: region.color
      }));
      
      // Create connections between nodes
      const connections: NeuralConnection[] = [];
      nodes.forEach(fromNode => {
        nodes.forEach(toNode => {
          if (fromNode.id !== toNode.id && deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `connection_${fromNode.id}_${toNode.id}`) > 0.7) {
            connections.push({
              from: fromNode.id,
              to: toNode.id,
              strength: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `strength_${fromNode.id}_${toNode.id}`),
              type: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `type_${fromNode.id}_${toNode.id}`) > 0.5 ? 'excitatory' : 'inhibitory',
              active: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `active_${fromNode.id}_${toNode.id}`) > 0.4
            });
          }
        });
      });
      
      patterns.push({
        id: `pattern_${i}`,
        name: `Neural Pattern ${i + 1}`,
        nodes,
        connections,
        activity: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `pattern_${i}_activity`),
        coherence: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `pattern_${i}_coherence`),
        timestamp
      });
    }
    
    return patterns;
  }, []);
  
  // Generate mock brainwave data
  const mockBrainwaves: BrainWave[] = useMemo(() => {
    const waves: BrainWave[] = [];
    const waveTypes: Array<'alpha' | 'beta' | 'theta' | 'delta' | 'gamma'> = ['alpha', 'beta', 'theta', 'delta', 'gamma'];
    
    for (let i = 0; i < 50; i++) {
      waveTypes.forEach(type => {
        waves.push({
          frequency: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `wave_${type}_${i}_freq`, 1, 51),
          amplitude: deterministicValue(patientId || 'patient_demo', sessionId || 'session_1', `wave_${type}_${i}_amp`),
          type,
          timestamp: new Date(Date.now() - (50 - i) * 1000)
        });
      });
    }
    
    return waves;
  }, []);
  
  const processedPatterns = neuralData?.patterns || mockNeuralPatterns;
  const processedWaves = neuralData?.brainwaves || mockBrainwaves;
  const currentPattern = processedPatterns.find(p => p.id === selectedPatternId) || processedPatterns[0];
  
  useEffect(() => {
    if (processedPatterns.length > 0 && !selectedPatternId) {
      setSelectedPatternId(processedPatterns[0].id);
    }
  }, [processedPatterns, selectedPatternId]);
  
  if (isLoading && !mockNeuralPatterns.length) {
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
    <div className={`space-y-6 ${className}`} data-testid="neural-patterns">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Neural Network Patterns
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Advanced visualization of brain activity and neural correlations during EMDR therapy
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={realTime ? "default" : "outline"} className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {realTime ? 'Live' : 'Historical'}
              </Badge>
              <Button variant="outline" size="sm" data-testid="button-export-neural">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* View Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">View:</label>
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                  <SelectTrigger className="w-32" data-testid="select-view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">Neural Network</SelectItem>
                    <SelectItem value="waves">Brainwaves</SelectItem>
                    <SelectItem value="both">Combined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {viewMode !== 'waves' && (
                <>
                  <Button
                    variant={showConnections ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowConnections(!showConnections)}
                    data-testid="button-toggle-connections"
                  >
                    <Network className="w-4 h-4 mr-1" />
                    Connections
                  </Button>
                  
                  <Button
                    variant={animated ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnimated(!animated)}
                    data-testid="button-toggle-animation"
                  >
                    {animated ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {animated ? 'Pause' : 'Animate'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Neural Network Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                {viewMode === 'waves' ? 'Brainwave Activity' : 'Neural Network Activity'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'waves' ? (
                <BrainwaveVisualization waves={processedWaves} />
              ) : viewMode === 'both' ? (
                <div className="space-y-4">
                  <NeuralNetworkVisualization 
                    pattern={currentPattern} 
                    showConnections={showConnections}
                    animated={animated}
                    width={600}
                    height={300}
                  />
                  <BrainwaveVisualization waves={processedWaves} width={600} height={150} />
                </div>
              ) : (
                <NeuralNetworkVisualization 
                  pattern={currentPattern} 
                  showConnections={showConnections}
                  animated={animated}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Control Panel */}
        <div className="space-y-6">
          {/* Pattern Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-green-500" />
                Pattern Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NeuralActivityTimeline 
                patterns={processedPatterns}
                selectedPattern={selectedPatternId}
                onPatternSelect={setSelectedPatternId}
              />
            </CardContent>
          </Card>
          
          {/* Pattern Analysis */}
          {currentPattern && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  Current Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatternAnalysisPanel pattern={currentPattern} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}