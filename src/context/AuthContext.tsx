import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection test as required by Firebase skill
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const fbErr = err as { code?: string; message?: string };
      const code = fbErr.code || '';
      const message = fbErr.message || '';
      const currentHost = window.location.hostname;

      if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        setAuthError(
          `【承認済みドメイン未登録エラー】現在のドメイン「${currentHost}」がFirebaseの承認済みドメインに登録されていません。Firebase Consoleの「Authentication」>「設定」>「承認済みドメイン」に「${currentHost}」または「run.app」を追加してください。`
        );
      } else if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
        setAuthError(
          'ブラウザのセキュリティ設定により、Googleログイン画面（ポップアップ）がブロックされました。ブラウザのアドレスバー右側のポップアップ許可アイコンから許可するか、別タブで開いてお試しください。'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('ログイン画面が途中で閉じられました。再度ログインボタンを押してお試しください。');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Firebase ConsoleでGoogleログインが有効化されていません。「Authentication」>「Sign-in method」でGoogleプロバイダを有効にしてください。'
        );
      } else {
        setAuthError(`Googleログインエラー [${code}]: ${message}`);
      }
      throw err;
    }
  };

  const signInAsGuest = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: unknown) {
      console.error('Guest sign-in failed:', err);
      setAuthError('ゲストサインインに失敗しました。');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
