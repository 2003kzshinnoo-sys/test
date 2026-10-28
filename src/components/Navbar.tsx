import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  Database,
  Key,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenSecurityModal: () => void;
  onOpenSecretsModal: () => void;
  reportCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenSecurityModal, 
  onOpenSecretsModal, 
  reportCount 
}) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch {
      // Ignored
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <Receipt className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">SmartReceipt</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">写真つき経費領収書・報告システム</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* HStorage & Secrets Guide button */}
          <button
            onClick={onOpenSecretsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors shadow-sm"
            title="HStorage（エイチストレージ）APIとSecrets設定手順"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">HStorage設定</span>
          </button>

          {/* Security & RLS Rule status badge */}
          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 transition-colors shadow-sm"
            title="セキュリティルールと保護状態を確認"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">セキュリティ保護（RLS適用済）</span>
            <span className="md:hidden">保護中</span>
          </button>

          {/* User Auth Section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-emerald-500 animate-spin" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'ユーザー'}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-400/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-medium max-w-[100px] sm:max-w-[140px] truncate">
                  {user.displayName || user.email || 'ログイン中'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.displayName || 'ユーザー'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email || 'ゲストアカウント'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-400">
                        <Database className="w-3.5 h-3.5" />
                        <span>登録件数: {reportCount} 件</span>
                      </div>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <LogOut className="w-4 h-4" />
                        ログアウト
                      </button>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleGoogleLogin}
                        disabled={isSigningIn}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-300 hover:bg-slate-700/60 rounded-lg transition"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Google連携（任意）</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
