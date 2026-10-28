import React, { useState } from 'react';
import { ExpenseReport } from '../types/report';
import { 
  Calendar, 
  Store, 
  FileText, 
  Trash2, 
  Eye, 
  Edit3, 
  FileIcon,
  ExternalLink,
  Lock
} from 'lucide-react';

interface ReportCardProps {
  report: ExpenseReport;
  onView: (report: ExpenseReport) => void;
  onEdit: (report: ExpenseReport) => void;
  onDelete: (report: ExpenseReport) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '交通費': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  '飲食・接待費': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  '消耗品費': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  '会議費': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  '旅費宿泊費': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  '通信費': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  '図書研修費': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  'その他': 'bg-slate-700/50 text-slate-300 border-slate-600/30',
};

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onView,
  onEdit,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);
  const isPdf = report.fileType === 'application/pdf' || report.fileName.toLowerCase().endsWith('.pdf');
  const catColor = CATEGORY_COLORS[report.category] || CATEGORY_COLORS['その他'];

  return (
    <div className="group bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
      {/* Top Media / Thumbnail Section */}
      <div 
        onClick={() => onView(report)}
        className="relative h-44 bg-slate-950/70 cursor-pointer overflow-hidden flex items-center justify-center border-b border-slate-800/80 group-hover:border-slate-700 transition"
      >
        {isPdf ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-105 transition-transform">
              <FileIcon className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-rose-300 tracking-wider uppercase">PDF 領収書</span>
            <span className="text-[11px] text-slate-400 max-w-[200px] truncate mt-0.5">{report.fileName}</span>
          </div>
        ) : !imageError && report.fileUrl ? (
          <img
            src={report.fileUrl}
            alt={report.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-slate-500">
            <FileText className="w-10 h-10 mb-1 stroke-1" />
            <span className="text-xs">プレビューなし</span>
          </div>
        )}

        {/* Amount Overlay Banner */}
        <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          <div className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
            ¥{report.amount.toLocaleString()}
          </div>
        </div>

        {/* Category Badge Top Left */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-sm ${catColor}`}>
            {report.category}
          </span>
        </div>

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>詳細を見る</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Store */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{report.date}</span>
            </div>
            {report.merchant && (
              <div className="flex items-center gap-1.5 max-w-[140px] truncate text-slate-300">
                <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{report.merchant}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 
            onClick={() => onView(report)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 cursor-pointer mb-1.5"
          >
            {report.title}
          </h3>

          {/* Description snippet */}
          {report.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {report.description}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-auto">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500/70" />
            <span>本人専用</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(report)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="編集"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(report)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="削除（ストレージのファイルも削除）"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
