/**
 * CircumplexModel Component
 * Complete visualization of 98 affects in emotional space
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Info
} from 'lucide-react';
import type { EmotionData } from '@/../../shared/types';
import { affects98, calculateAffects } from '@/../../shared/emotionAffects';

interface CircumplexModelProps {
  emotionData?: EmotionData;
  showLabels?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  interactive?: boolean;
  fullscreen?: boolean;
}

// Affects98 mapping is now imported from shared/emotionAffects.ts

export default function CircumplexModel({
  emotionData,
  showLabels = true,
  showGrid = true,
  animated = true,
  interactive = true,
  fullscreen = false
}: CircumplexModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [hoveredAffect, setHoveredAffect] = useState<string | null>(null);
  const animationRef = useRef<number>();
  
  // Animation state for pulsing current emotion
  const [pulseSize, setPulseSize] = useState(0);
  
  // Draw the complete circumplex model
  const drawCircumplex = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.4 * zoom;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 1.2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
      ctx.lineWidth = 1;
      
      // Concentric circles
      for (let i = 0.2; i <= 1; i += 0.2) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Radial lines
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * scale,
          centerY + Math.sin(angle) * scale
        );
        ctx.stroke();
      }
    }
    
    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    // X-axis (Valence)
    ctx.beginPath();
    ctx.moveTo(centerX - scale, centerY);
    ctx.lineTo(centerX + scale, centerY);
    ctx.stroke();
    
    // Y-axis (Arousal)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - scale);
    ctx.lineTo(centerX, centerY + scale);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Valence labels
    ctx.fillText('Негативные', centerX - scale - 30, centerY);
    ctx.fillText('Позитивные', centerX + scale + 30, centerY);
    
    // Arousal labels
    ctx.save();
    ctx.translate(centerX, centerY - scale - 20);
    ctx.fillText('Высокое возбуждение', 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(centerX, centerY + scale + 20);
    ctx.fillText('Низкое возбуждение', 0, 0);
    ctx.restore();
    
    // Draw quadrant labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.font = '11px Inter';
    ctx.fillText('Возбужденные +', centerX + scale * 0.5, centerY - scale * 0.5 - 10);
    ctx.fillText('Спокойные +', centerX + scale * 0.5, centerY + scale * 0.5 + 10);
    ctx.fillText('Депрессивные -', centerX - scale * 0.5, centerY + scale * 0.5 + 10);
    ctx.fillText('Стрессовые -', centerX - scale * 0.5, centerY - scale * 0.5 - 10);
    
    // Draw all 98 affects as points
    for (const [name, coords] of Object.entries(affects98)) {
      const x = centerX + coords.valence * scale;
      const y = centerY - coords.arousal * scale; // Invert Y for proper display
      
      // Calculate color based on valence and arousal
      const hue = coords.valence > 0 ? 120 : 0; // Green for positive, red for negative
      const saturation = Math.abs(coords.valence) * 100;
      const lightness = 50 + (1 - Math.abs(coords.arousal)) * 20;
      
      // Highlight if current emotion is close
      let radius = 4;
      let alpha = 0.6;
      
      if (emotionData && emotionData.affects[name] > 20) {
        radius = 4 + (emotionData.affects[name] / 100) * 6;
        alpha = 0.8 + (emotionData.affects[name] / 100) * 0.2;
      }
      
      // Hover effect
      if (hoveredAffect === name) {
        radius += 3;
        alpha = 1;
      }
      
      // Draw affect point
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border for better visibility
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness * 0.8}%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label if close to current emotion or hovered
      if (showLabels && (hoveredAffect === name || (emotionData && emotionData.affects[name] > 30))) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y - radius - 5);
      }
    }
    
    // Draw current emotion point if available
    if (emotionData) {
      const currentX = centerX + (emotionData.valence * 2 - 1) * scale;
      const currentY = centerY - (emotionData.arousal * 2 - 1) * scale;
      
      // Draw trail effect
      if (animated) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 15 + pulseSize, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Main current emotion point
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // White center
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw current emotion label
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Текущее', currentX, currentY + 25);
    }
    
    // Draw legend
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    const legendY = height - 40;
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.fillRect(20, legendY, 15, 10);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Негативные эмоции', 40, legendY + 8);
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.fillRect(160, legendY, 15, 10);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Позитивные эмоции', 180, legendY + 8);
    
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(300, legendY, 15, 10);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Текущее состояние', 320, legendY + 8);
  };
  
  // Animation loop for pulsing effect
  useEffect(() => {
    if (!animated) return;
    
    let pulse = 0;
    const animate = () => {
      pulse += 0.05;
      setPulseSize(Math.sin(pulse) * 5 + 5);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated]);
  
  // Redraw on state changes
  useEffect(() => {
    drawCircumplex();
  }, [emotionData, zoom, showLabels, showGrid, pulseSize, hoveredAffect]);
  
  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.4 * zoom;
    
    // Check if hovering over any affect
    let foundHover = false;
    for (const [name, coords] of Object.entries(affects98)) {
      const affectX = centerX + coords.valence * scale;
      const affectY = centerY - coords.arousal * scale;
      
      const distance = Math.sqrt(Math.pow(x - affectX, 2) + Math.pow(y - affectY, 2));
      
      if (distance < 10) {
        setHoveredAffect(name);
        foundHover = true;
        break;
      }
    }
    
    if (!foundHover) {
      setHoveredAffect(null);
    }
  };
  
  const handleReset = () => {
    setZoom(1);
  };
  
  const canvasSize = isFullscreen ? 600 : 400;
  
  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Circumplex Model - 98 эмоциональных состояний</span>
          <div className="flex items-center space-x-2">
            {hoveredAffect && (
              <Badge variant="outline">
                {hoveredAffect}
                {emotionData && emotionData.affects[hoveredAffect] && (
                  <span className="ml-1 font-bold">
                    ({Math.round(emotionData.affects[hoveredAffect])}%)
                  </span>
                )}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="w-full h-full border rounded-lg cursor-crosshair bg-white dark:bg-gray-950"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredAffect(null)}
            data-testid="circumplex-canvas"
          />
          
          {/* Info panel */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p>Модель отображает 98 эмоциональных состояний в двумерном пространстве:</p>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Горизонтальная ось - валентность (негатив/позитив)</li>
                  <li>Вертикальная ось - возбуждение (высокое/низкое)</li>
                  <li>Размер точки показывает интенсивность эмоции</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}