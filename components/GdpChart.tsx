import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import useStore from '@/lib/store';

export default function GdpChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { selectedYear } = useStore();

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const updateChart = async () => {
      const res = await fetch('/api/economy/gdp?aggregate=true');
      if (!res.ok) return;
      const data = await res.json();
      const option = {
        title: { text: 'National GDP Over Time' },
        xAxis: { type: 'category', data: data.map((d: any) => d.year) },
        yAxis: { type: 'value' },
        series: [{ data: data.map((d: any) => d.total), type: 'line' }],
        dataZoom: [{ type: 'slider' }],
        markLine: { data: [{ xAxis: selectedYear }] },
      };
      chart.setOption(option);
    };

    updateChart();

    return () => chart.dispose();
  }, [selectedYear]);

  return <div ref={chartRef} style={{ width: '100%', height: '200px' }} />;
} 