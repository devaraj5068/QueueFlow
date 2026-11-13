import React from 'react';
import { HelpCircle } from 'lucide-react';

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo', // 'indigo', 'emerald', 'amber', 'rose'
  tooltip,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-brand-50',
      text: 'text-brand-500',
      border: 'border-brand-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-500',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-500',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-500',
      border: 'border-rose-100',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 transition-all hover:shadow-elevated">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0 border ${scheme.border}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h4>
      </div>

      {subtitle && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>{subtitle}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
