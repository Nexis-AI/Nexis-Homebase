"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface ConnectionTimeChartProps {
  connectionTimes: number[];
  labels?: string[];
  title?: string;
  description?: string;
}

export function ConnectionTimeChart({
  connectionTimes,
  labels,
  title = "Connection Time History",
  description = "Visualization of recent wallet connection times"
}: ConnectionTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || connectionTimes.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Set dimensions
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Find max value for scaling
    const maxValue = Math.max(...connectionTimes, 5000); // At least 5000ms for scale
    
    // Colors
    const barColor = (time: number) => {
      if (time < 1000) return 'rgba(16, 185, 129, 0.7)'; // Green for fast
      if (time < 3000) return 'rgba(245, 158, 11, 0.7)'; // Yellow for medium
      return 'rgba(239, 68, 68, 0.7)'; // Red for slow
    };
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = chartWidth / (connectionTimes.length * 2);
    const barSpacing = barWidth;
    
    connectionTimes.forEach((time, index) => {
      const x = padding + (index * (barWidth + barSpacing));
      const barHeight = (time / maxValue) * chartHeight;
      const y = height - padding - barHeight;
      
      // Draw bar
      ctx.fillStyle = barColor(time);
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw value on top of bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${time}ms`, x + (barWidth / 2), y - 5);
      
      // Draw label under bar
      if (labels?.[index]) {
        ctx.fillText(labels[index], x + (barWidth / 2), height - padding + 15);
      } else {
        ctx.fillText(`#${index + 1}`, x + (barWidth / 2), height - padding + 15);
      }
    });
    
    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
    ctx.textAlign = 'right';
    
    // Draw 4 evenly spaced labels
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = height - padding - ((value / maxValue) * chartHeight);
      
      ctx.fillText(`${value}ms`, padding - 5, y + 3);
      
      // Draw grid line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Connection Time (ms)', width / 2, 15);
    
  }, [connectionTimes, labels]);

  if (connectionTimes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No connection data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[300px]">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={300} 
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
} 