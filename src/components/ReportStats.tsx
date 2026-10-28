import React from 'react';
import { ExpenseReport } from '../types/report';
import { JapaneseYen, FileText, Download, TrendingUp, FolderArchive } from 'lucide-react';

interface ReportStatsProps {
  reports: ExpenseReport[];
}

export const ReportStats: React.FC<ReportStatsProps> = ({ reports }) => {
  // Calculate total amount
  const totalAmount = reports.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Calculate current month amount
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthReports = reports.filter(r => r.date.startsWith(currentMonthStr));
  const thisMonthTotal = thisMonthReports.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Total file size
  const totalSizeBytes = reports.reduce((sum, r) => sum + (r.fileSize || 0), 0);
  const totalSizeFormatted = totalSizeBytes > 1024 * 1024 
    ? `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(totalSizeBytes / 1024)} KB`;

  // CSV Export
  const exportToCSV = () => {
    if (reports.length === 0) return;

    const headers = ['日付', 'タイトル', '金額(円)', 'カテゴリー', '支払先', '備考', '添付ファイル名', 'ファイルURL', 'ステータス'];
    const rows = reports.map(r => [
      `"${r.date}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      r.amount,
      `"${r.category}"`,
      `"${r.merchant.replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${r.fileName}"`,
      `"${r.fileUrl}"`,
      `"${r.status === 'pending' ? '申請中' : r.status === 'approved' ? '承認済' : '却下'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `経費領収書一覧_${currentMonthStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Amount */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">今月の経費合計</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <JapaneseYen className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
          ¥{thisMonthTotal.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>今月 {thisMonthReports.length} 件</span>
        </div>
      </div>

      {/* All Time Total */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">累計支出金額</span>
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
          ¥{totalAmount.toLocaleString()}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          全期間の合計
        </div>
      </div>

      {/* Reports Count */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">保管中の領収書</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {reports.length} <span className="text-xs font-normal text-slate-400">件</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <FolderArchive className="w-3 h-3 text-blue-400" />
          <span>容量: {totalSizeFormatted}</span>
        </div>
      </div>

      {/* CSV Export & Actions */}
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">経理提出用データ</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Download className="w-4 h-4" />
          </div>
        </div>
        <div>
          <button
            onClick={exportToCSV}
            disabled={reports.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV出力</span>
          </button>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          Excel / スプレッドシート互換
        </div>
      </div>
    </div>
  );
};
