import React from 'react';
import { Receipt, Plus, Search, ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  isFiltered: boolean;
  onOpenCreateModal: () => void;
  onClearFilters?: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isFiltered,
  onOpenCreateModal,
  onClearFilters,
  isAuthenticated,
  onLogin,
}) => {
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          ログインして領収書を管理
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
          セキュリティ保護（RLS）により、登録した領収書と経費データはあなたのアカウントだけに安全に保管されます。
        </p>
        <button
          onClick={onLogin}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition active:scale-95"
        >
          Googleでログインして始める
        </button>
      </div>
    );
  }

  if (isFiltered) {
    return (
      <div className="text-center py-14 px-4 bg-slate-900/30 rounded-3xl border border-slate-800/60 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">
          該当する報告が見つかりませんでした
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          検索条件やカテゴリー・期間の指定を変更してお試しください。
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            フィルターをリセット
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
        <Receipt className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        保存された領収書報告がありません
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
        新幹線代、接待飲食費、オフィス消耗品などの領収書写真やPDFをアップロードして、経費報告を作成しましょう。
      </p>
      <button
        onClick={onOpenCreateModal}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition active:scale-95"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>最初の経費報告を作成</span>
      </button>
    </div>
  );
};
