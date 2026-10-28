import React, { useState } from 'react';
import { ExpenseReport } from '../types/report';
import { 
  X, 
  Trash2, 
  Edit3, 
  Download, 
  ExternalLink, 
  Calendar, 
  Store, 
  Tag, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle,
  ZoomIn,
  Loader2,
  FileIcon
} from 'lucide-react';

interface ReportDetailModalProps {
  report: ExpenseReport | null;
  onClose: () => void;
  onEdit: (report: ExpenseReport) => void;
  onDelete: (report: ExpenseReport) => Promise<void>;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!report) return null;

  const isPdf = report.fileType === 'application/pdf' || report.fileName.toLowerCase().endsWith('.pdf');
  const sizeFormatted = report.fileSize > 1024 * 1024
    ? `${(report.fileSize / (1024 * 1024)).toFixed(2)} MB`
    : `${(report.fileSize / 1024).toFixed(0)} KB`;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDelete(report);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      setDeleteError(err instanceof Error ? err.message : '削除に失敗しました。');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {report.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {report.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(report);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>編集</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 border border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>削除</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div className="m-6 p-4 bg-rose-950/40 border border-rose-600/50 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">本当にこの報告を削除しますか？</h4>
                <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                  データベース（Firestore）の報告データと、ストレージ（Firebase Storage）に保存されている添付ファイル（{report.fileName}）の両方が完全に削除されます。この操作は取り消せません。
                </p>
                {deleteError && (
                  <p className="text-xs text-rose-300 font-bold mt-2">{deleteError}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>ファイルとデータを削除中...</span>
                      </>
                    ) : (
                      <span>完全に削除する</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Attachment Viewer */}
          <div className="p-6 flex flex-col justify-between bg-slate-950/40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  添付領収書プレビュー
                </h3>
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>全画面表示</span>
                </a>
              </div>

              {/* Media Container */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 flex items-center justify-center min-h-[300px] max-h-[440px]">
                {isPdf ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 shadow-lg">
                      <FileIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{report.fileName}</h4>
                    <p className="text-xs text-slate-400 mb-4">{sizeFormatted} • PDF Document</p>
                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PDFをブラウザで開く</span>
                    </a>
                  </div>
                ) : report.fileUrl ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={report.fileUrl}
                      alt={report.title}
                      className="max-h-[420px] w-auto max-w-full object-contain"
                    />
                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-white hover:text-emerald-400 border border-slate-700 transition opacity-0 group-hover:opacity-100 shadow-xl"
                      title="拡大表示"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">プレビュー可能なファイルがありません</p>
                  </div>
                )}
              </div>
            </div>

            {/* Storage metadata info */}
            <div className="mt-4 p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>ファイル名:</span>
                </span>
                <span className="text-slate-200 font-mono max-w-[180px] truncate">{report.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>容量 / 形式:</span>
                <span className="text-slate-200">{sizeFormatted} ({report.fileType})</span>
              </div>
              <div className="flex items-center justify-between">
                <span>保存先パス:</span>
                <span className="text-slate-400 font-mono text-[10px] max-w-[200px] truncate" title={report.filePath}>
                  {report.filePath}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Expense Details */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Amount Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/20 border border-emerald-500/20">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">経費金額</span>
                <div className="text-3xl font-black text-white mt-1 tracking-tight">
                  ¥{report.amount.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-2">（税込）</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <span className="text-xs text-slate-400 font-medium">報告タイトル</span>
                <h2 className="text-lg font-bold text-white mt-0.5 leading-snug">
                  {report.title}
                </h2>
              </div>

              {/* Key metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>利用日</span>
                  </span>
                  <span className="font-semibold text-white">{report.date}</span>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 flex items-center gap-1 mb-1">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    <span>支払先 / 店舗</span>
                  </span>
                  <span className="font-semibold text-white truncate block">{report.merchant}</span>
                </div>
              </div>

              {/* Purpose / Description */}
              <div>
                <span className="text-xs text-slate-400 font-medium">本文 / 経費の用途・詳細</span>
                <div className="mt-1 p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </div>
              </div>
            </div>

            {/* Submitter & Security verification info */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>セキュリティルールにより本人のみ閲覧・操作可能</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>申請者: {report.userEmail}</span>
                <span>登録: {new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
