import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import './index.scss';

interface ChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
}

export function Chart({ option, height = 300, className = '' }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);

    // 设置配置项
    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [option]);

  // 当 option 变化时更新图表
  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  return <div ref={chartRef} className={`chart-container ${className}`} style={{ height }} />;
}
