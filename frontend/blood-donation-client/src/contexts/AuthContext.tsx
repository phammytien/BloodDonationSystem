import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface UserSession {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  roleName: string;
  fullName: string; // From Donors table — used for avatar
  avatarUrl?: string | null;
  isProfileUpdated?: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
  loading: boolean;
  profilePromptDismissed: boolean;
  dismissProfilePrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(() => {
    return sessionStorage.getItem('profile_prompt_dismissed') === 'true';
  });

  useEffect(() => {
    // Restore session from sessionStorage on startup
    const storedUser = sessionStorage.getItem('bd_user_session');
    if (storedUser) {
      try {
        const parsed: UserSession = JSON.parse(storedUser);

        // If session has no fullName (old session) or fullName equals username (was set as fallback),
        // and user is a Donor — fetch actual fullName from Donors table via API.
        const needsFullName =
          parsed.roleName?.toLowerCase() === 'donor' &&
          parsed.token &&
          (!parsed.fullName || parsed.fullName === parsed.username);

        if (needsFullName) {
          axios
            .get('http://localhost:5028/api/donor/profile', {
              headers: { Authorization: `Bearer ${parsed.token}` },
            })
            .then((res) => {
              const enriched: UserSession = { 
                ...parsed, 
                fullName: res.data.fullName || parsed.username,
                avatarUrl: res.data.avatar || null
              };
              setUser(enriched);
              sessionStorage.setItem('bd_user_session', JSON.stringify(enriched));
            })
            .catch(() => {
              setUser(parsed);
            })
            .finally(() => setLoading(false));
          return; 
        }

        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse stored user session', e);
        sessionStorage.removeItem('bd_user_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (session: UserSession) => {
    setUser(session);
    sessionStorage.setItem('bd_user_session', JSON.stringify(session));
  };

  const logout = () => {
    sessionStorage.removeItem('bd_user_session');
    sessionStorage.removeItem('profile_prompt_dismissed');
    localStorage.setItem('logout_success_toast', 'true');
    setUser(null);
    setProfilePromptDismissed(false);
    window.location.href = '/';
  };

  const dismissProfilePrompt = () => {
    sessionStorage.setItem('profile_prompt_dismissed', 'true');
    setProfilePromptDismissed(true);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, profilePromptDismissed, dismissProfilePrompt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
