import React from 'react';
import { CATEGORIES, ReportCategory, ReportFilterOptions } from '../types/report';
import { Search, Plus, Filter, Calendar } from 'lucide-react';

interface ReportFilterBarProps {
  filters: ReportFilterOptions;
  onFilterChange: (filters: ReportFilterOptions) => void;
  onOpenCreateModal: () => void;
  availableMonths: string[];
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFilterChange,
  onOpenCreateModal,
  availableMonths
}) => {
  return (
    <div className="space-y-3 mb-6">
      {/* Top row: Search input + Month filter + Create CTA */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="タイトル、支払先、備考を検索..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={filters.month}
              onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
              className="appearance-none pl-8 pr-8 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="all">全期間</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m.replace('-', '年')}月
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort order */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as ReportFilterOptions['sortBy'] })}
            className="appearance-none px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="date-desc">日付が新しい順</option>
            <option value="date-asc">日付が古い順</option>
            <option value="amount-desc">金額が高い順</option>
            <option value="amount-asc">金額が安い順</option>
          </select>

          {/* Create Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>報告を作成</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        <button
          onClick={() => onFilterChange({ ...filters, category: 'all' })}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            filters.category === 'all'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
          }`}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange({ ...filters, category: cat })}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filters.category === cat
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
