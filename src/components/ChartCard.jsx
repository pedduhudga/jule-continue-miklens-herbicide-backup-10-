import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ChartCard({ id, title, description, config, height = "300px" }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    try {
      chartRef.current = new Chart(canvasRef.current, config);
    } catch (e) {
      console.error(`Failed to create chart ${id}:`, e);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [config, id]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-5 dashboard-card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div style={{ height, position: 'relative', width: '100%' }}>
        <canvas id={id} ref={canvasRef}></canvas>
      </div>
    </div>
  );
}
