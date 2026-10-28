import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ReportStats } from './components/ReportStats';
import { ReportFilterBar } from './components/ReportFilterBar';
import { ReportCard } from './components/ReportCard';
import { ReportFormModal } from './components/ReportFormModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { SecurityInfoModal } from './components/SecurityInfoModal';
import { StorageSecretsModal } from './components/StorageSecretsModal';
import { EmptyState } from './components/EmptyState';
import { ExpenseReport, ExpenseReportFormData, ReportFilterOptions } from './types/report';
import { 
  subscribeUserReports, 
  createReport, 
  updateReport, 
  deleteReport 
} from './lib/reportsService';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  CloudUpload, 
  Sparkles,
  Receipt
} from 'lucide-react';

function MainApp() {
  const { user, loading: authLoading, signInWithGoogle, signInAsGuest } = useAuth();
  
  // Reports state
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ReportFilterOptions>({
    searchQuery: '',
    category: 'all',
    month: 'all',
    sortBy: 'date-desc',
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ExpenseReport | null>(null);
  const [detailReport, setDetailReport] = useState<ExpenseReport | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time Firestore synchronization for current user
  useEffect(() => {
    if (!user) {
      setReports([]);
      setIsReportsLoading(false);
      return;
    }

    setIsReportsLoading(true);
    setReportsError(null);

    const unsubscribe = subscribeUserReports(
      user.uid,
      (userReports) => {
        setReports(userReports);
        setIsReportsLoading(false);
      },
      (err) => {
        console.error('Reports subscription error:', err);
        setReportsError('データの取得に失敗しました。');
        setIsReportsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Extract available months from existing reports
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    reports.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        monthsSet.add(r.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [reports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Search query filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchMerchant = r.merchant.toLowerCase().includes(q);
          const matchDesc = (r.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchMerchant && !matchDesc) return false;
        }

        // Category filter
        if (filters.category !== 'all' && r.category !== filters.category) {
          return false;
        }

        // Month filter
        if (filters.month !== 'all' && !r.date.startsWith(filters.month)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'date-desc':
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [reports, filters]);

  // Handlers
  const handleOpenCreate = () => {
    if (!user) {
      showToast('報告を作成するにはログインしてください。', 'error');
      return;
    }
    setEditingReport(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (report: ExpenseReport) => {
    setEditingReport(report);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: ExpenseReportFormData) => {
    if (!user) return;

    if (editingReport) {
      await updateReport(editingReport.id, formData, editingReport, user.uid);
      showToast('経費報告を更新しました。');
    } else {
      await createReport(formData, user.uid, user.email || 'user@example.com');
      showToast('領収書をストレージに保存し、経費報告を登録しました。');
    }
  };

  const handleDeleteReport = async (report: ExpenseReport) => {
    await deleteReport(report);
    showToast('ストレージの添付ファイルと報告データを完全に削除しました。');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation */}
      <Navbar
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenSecretsModal={() => setIsSecretsModalOpen(true)}
        reportCount={reports.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-slate-900 border-emerald-500 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-slate-900 border-rose-500 text-rose-300 shadow-rose-500/10'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* If user is not signed in: Hero banner */}
        {!user && !authLoading && (
          <div className="mb-8 p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-2xl text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>データベース & ストレージ連携 経費領収書アプリ</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
              写真・PDFを安全にクラウド保存<br />
              スマート経費精算・報告
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
              領収書写真やPDFファイルをアップロードすると、クラウドストレージに安全に保管され、Firestoreデータベースに記録されます。セキュリティルール（RLS）により、本人以外のアクセスや一括改ざんを確実に防ぎます。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition"
              >
                Googleでログインして始める
              </button>
              <button
                onClick={() => signInAsGuest()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
              >
                ゲストモードで試す
              </button>
            </div>
          </div>
        )}

        {/* User is signed in: show stats & filter & list */}
        {user && (
          <>
            {/* Dashboard metrics */}
            <ReportStats reports={reports} />

            {/* Filter toolbar */}
            <ReportFilterBar
              filters={filters}
              onFilterChange={setFilters}
              onOpenCreateModal={handleOpenCreate}
              availableMonths={availableMonths}
            />

            {/* Reports Grid or Empty State */}
            {isReportsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="h-36 bg-slate-800 rounded-xl mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <EmptyState
                isFiltered={
                  Boolean(filters.searchQuery) ||
                  filters.category !== 'all' ||
                  filters.month !== 'all'
                }
                onOpenCreateModal={handleOpenCreate}
                onClearFilters={() =>
                  setFilters({
                    searchQuery: '',
                    category: 'all',
                    month: 'all',
                    sortBy: 'date-desc',
                  })
                }
                isAuthenticated={true}
                onLogin={() => signInWithGoogle()}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={(r) => setDetailReport(r)}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteReport}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* If user is not signed in and not loading: prompt */}
        {!user && !authLoading && (
          <EmptyState
            isFiltered={false}
            onOpenCreateModal={handleOpenCreate}
            isAuthenticated={false}
            onLogin={() => signInWithGoogle()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>SmartReceipt • クラウド経費領収書アプリ</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSecretsModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-medium transition"
            >
              HStorage (Secrets) 設定
            </button>
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              セキュリティルール（RLS仕様）
            </button>
            <span>Firebase Firestore & HStorage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReportFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        editReport={editingReport}
      />

      <ReportDetailModal
        report={detailReport}
        onClose={() => setDetailReport(null)}
        onEdit={(r) => {
          setEditingReport(r);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteReport}
      />

      <SecurityInfoModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <StorageSecretsModal
        isOpen={isSecretsModalOpen}
        onClose={() => setIsSecretsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
