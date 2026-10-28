import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  Database,
  Cloud,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenSecurityModal: () => void;
  reportCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSecurityModal, reportCount }) => {
  const { user, loading, signInWithGoogle, signInAsGuest, signOut, authError, clearAuthError } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch {
      // Error handled in auth context
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInAsGuest();
    } catch {
      // Error handled in auth context
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
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Googleでログイン</span>
              </button>
              <button
                onClick={handleGuestLogin}
                disabled={isSigningIn}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>ゲスト利用</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-rose-900/80 text-rose-100 text-xs px-4 py-2 flex items-center justify-between border-t border-rose-700">
          <span>{authError}</span>
          <button 
            onClick={clearAuthError}
            className="text-xs underline hover:text-white ml-2"
          >
            閉じる
          </button>
        </div>
      )}
    </header>
  );
};
