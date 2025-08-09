import React, { useState } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, color = '#4f46e5' }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const chartHeight = 250;
  const chartWidth = 500; // Will be responsive via SVG viewBox
  const barMargin = 10;
  const barWidth = (chartWidth - (data.length - 1) * barMargin) / data.length;
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const valueToHeightRatio = maxValue > 0 ? chartHeight / maxValue : 0;

  const yAxisLabels = [];
  if (maxValue > 0) {
    for (let i = 0; i <= 4; i++) {
        const value = (maxValue / 4) * i;
        yAxisLabels.push({ value: Math.round(value), y: chartHeight - (value * valueToHeightRatio) });
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<SVGRectElement>, item: ChartData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setTooltip({
      x: rect.left - svgRect.left + rect.width / 2,
      y: rect.top - svgRect.top - 10,
      label: item.label,
      value: item.value,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="relative">
      <svg viewBox={`-50 -10 ${chartWidth + 70} ${chartHeight + 50}`} className="w-full h-auto">
        {/* Y Axis Labels and Grid Lines */}
        {yAxisLabels.map(label => (
          <g key={label.value}>
            <text x="-10" y={label.y + 4} textAnchor="end" fontSize="12" fill="#6b7280">{`₹${label.value}`}</text>
            <line x1="0" y1={label.y} x2={chartWidth} y2={label.y} stroke="#e5e7eb" strokeDasharray="3,3" />
          </g>
        ))}
        
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = item.value * valueToHeightRatio;
          const x = index * (barWidth + barMargin);
          const y = chartHeight - barHeight;
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className="transition-opacity duration-200 hover:opacity-80"
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              />
               <text 
                x={x + barWidth / 2} 
                y={chartHeight + 20} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#6b7280"
              >
                {item.label}
              </text>
            </g>
          );
        })}

         {/* X and Y axis lines */}
        <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#9ca3af" />
        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#9ca3af" />
      </svg>
      {tooltip && (
        <div 
            className="absolute p-2 text-sm bg-gray-800 text-white rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-bold">{tooltip.label}</div>
          <div>Sales: ₹{tooltip.value.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
