import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const DEFAULT_USER: AppUser = {
  uid: 'user_main',
  email: '2003.kz.shinnoo@gmail.com',
  displayName: 'メインユーザー',
  photoURL: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(DEFAULT_USER);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection test as required by Firebase skill
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Googleユーザー',
          photoURL: currentUser.photoURL,
        });
      } else {
        // Fall back to active default user (no login blocker)
        setUser(DEFAULT_USER);
      }
      setLoading(false);
    }, (error) => {
      console.warn('Auth state notice:', error);
      setUser(DEFAULT_USER);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || 'Googleユーザー',
          photoURL: cred.user.photoURL,
        });
      }
    } catch (err: unknown) {
      console.warn('Google Sign-in bypass notice:', err);
      // Seamlessly keep user active as default user without blocking
      setUser(DEFAULT_USER);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Sign-out notice:', err);
    }
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
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
