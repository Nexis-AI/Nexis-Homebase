"use client"

import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts'
import { Card } from '@/components/ui/card'
import { useTheme } from 'next-themes'

interface ChartData {
  time: string | number;
  value: number;
}

interface TradingViewChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  title?: string;
  symbol?: string;
  currentPrice?: number;
  high24h?: number;
  low24h?: number;
  formatTooltip?: (value: number) => string;
  timeVisible?: boolean;
  autosize?: boolean;
}

const defaultFormatTooltip = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export function TradingViewChart({
  data,
  width = 600,
  height = 300,
  title,
  symbol = 'USD',
  currentPrice,
  high24h,
  low24h,
  formatTooltip = defaultFormatTooltip,
  timeVisible = true,
  autosize = true
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: autosize ? chartContainerRef.current.clientWidth : width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: isDarkTheme ? '#17171F' : '#ffffff' },
        textColor: isDarkTheme ? '#d1d5db' : '#374151',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDarkTheme ? 'rgba(42, 46, 57, 0.5)' : 'rgba(42, 46, 57, 0.1)',
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: isDarkTheme ? 'rgba(42, 46, 57, 0.5)' : 'rgba(42, 46, 57, 0.1)',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDarkTheme ? 'rgba(224, 227, 235, 0.1)' : 'rgba(42, 46, 57, 0.1)',
          style: LineStyle.Solid,
        },
        horzLine: {
          width: 1,
          color: isDarkTheme ? 'rgba(224, 227, 235, 0.1)' : 'rgba(42, 46, 57, 0.1)',
          style: LineStyle.Solid,
          labelBackgroundColor: isDarkTheme ? '#565964' : '#e6ecf5',
        },
      },
      timeScale: {
        timeVisible,
        secondsVisible: false,
        borderColor: isDarkTheme ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.8)',
      },
      rightPriceScale: {
        borderColor: isDarkTheme ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.8)',
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Create area series
    const series = chart.addAreaSeries({
      topColor: isDarkTheme ? 'rgba(38, 166, 154, 0.56)' : 'rgba(34, 150, 243, 0.4)',
      bottomColor: isDarkTheme ? 'rgba(38, 166, 154, 0.04)' : 'rgba(34, 150, 243, 0.1)',
      lineColor: isDarkTheme ? '#26a69a' : '#2196f3',
      lineWidth: 2,
    });

    seriesRef.current = series;

    series.setData(data);

    // Set up custom tooltip
    const toolTipWidth = 100;
    const toolTipHeight = 80;
    const toolTipMargin = 15;

    // Create and style the tooltip
    const toolTip = document.createElement('div');
    toolTip.style.position = 'absolute';
    toolTip.style.display = 'none';
    toolTip.style.padding = '8px';
    toolTip.style.boxSizing = 'border-box';
    toolTip.style.fontSize = '12px';
    toolTip.style.textAlign = 'left';
    toolTip.style.zIndex = '1000';
    toolTip.style.top = '12px';
    toolTip.style.left = '12px';
    toolTip.style.pointerEvents = 'none';
    toolTip.style.borderRadius = '4px';
    toolTip.style.fontFamily = 'Inter, sans-serif';
    toolTip.style.backgroundColor = isDarkTheme ? 'rgba(31, 33, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    toolTip.style.color = isDarkTheme ? '#e6ecf5' : '#374151';
    toolTip.style.boxShadow = isDarkTheme 
      ? '0 2px 5px rgba(0, 0, 0, 0.5)' 
      : '0 2px 5px rgba(0, 0, 0, 0.15)';
    toolTip.style.border = isDarkTheme 
      ? '1px solid rgba(197, 203, 206, 0.3)' 
      : '1px solid rgba(197, 203, 206, 0.8)';
    
    chartContainerRef.current.appendChild(toolTip);
    
    // Set up crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current?.clientWidth ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        toolTip.style.display = 'none';
        return;
      }

      const dateStr = param.time.toString();
      const price = param.seriesPrices.get(series);

      if (!price) {
        toolTip.style.display = 'none';
        return;
      }

      toolTip.style.display = 'block';
      
      let date;
      if (typeof param.time === 'number') {
        date = new Date(param.time * 1000);
      } else if (typeof param.time === 'string') {
        date = new Date(param.time);
      } else {
        date = new Date();
      }
      
      const formattedDate = date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const formattedTime = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });

      const formattedPrice = formatTooltip(price as number);
      
      toolTip.innerHTML = `
        <div style="font-weight:500">${formattedPrice}</div>
        <div style="font-size:11px;color:${isDarkTheme ? '#9ca3af' : '#6b7280'};margin-top:4px">
          ${formattedDate} at ${formattedTime}
        </div>
      `;

      const coordinate = series.priceToCoordinate(price as number);
      
      let shiftTop = 0;
      let shiftLeft = 0;
      
      if (coordinate) {
        shiftTop = coordinate - 50;
        
        if (param.point.x > chartContainerRef.current?.clientWidth - toolTipWidth - toolTipMargin) {
          shiftLeft = param.point.x - toolTipWidth - toolTipMargin;
        } else {
          shiftLeft = param.point.x + toolTipMargin;
        }
        
        toolTip.style.top = `${Math.max(0, shiftTop)}px`;
        toolTip.style.left = `${Math.max(0, shiftLeft)}px`;
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current && autosize) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (chartContainerRef.current?.contains(toolTip)) {
        chartContainerRef.current.removeChild(toolTip);
      }
    };
  }, [data, width, height, autosize, isDarkTheme, formatTooltip, timeVisible]);

  return (
    <div className="w-full">
      {title && <div className="text-xl font-bold mb-2">{title}</div>}
      <div className="relative overflow-hidden rounded-md">
        <div ref={chartContainerRef} className="w-full" />
        
        {currentPrice && (
          <div className="mt-4 flex items-center justify-between text-sm px-2">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Current</span>
              <span className="font-semibold">{formatTooltip(currentPrice)}</span>
            </div>
            
            {high24h && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">24h High</span>
                <span className="font-semibold">{formatTooltip(high24h)}</span>
              </div>
            )}
            
            {low24h && (
              <div className="flex flex-col">
                <span className="text-muted-foreground">24h Low</span>
                <span className="font-semibold">{formatTooltip(low24h)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 