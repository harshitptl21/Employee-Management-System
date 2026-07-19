'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, refreshAccessToken } from '@/lib/api';
import { isPrivilegedRole } from '@/lib/utils';
import { AuthUser, Employee, Role } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  profile: Employee | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const res = await api.get<{ data: Employee }>(`/employees/${userId}`);
      setProfile(res.data.data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Silent refresh via the httpOnly cookie so a page reload doesn't force a re-login.
    (async () => {
      const token = await refreshAccessToken();
      if (token) {
        const me = await api.get<{ data: AuthUser }>('/auth/me');
        setUser(me.data.data);
        await loadProfile(me.data.data.sub);
      }
      setIsLoading(false);
    })();
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, employee } = res.data.data;
      setAccessToken(accessToken);
      const authUser: AuthUser = { sub: employee.id, role: employee.role, email: employee.email };
      setUser(authUser);
      setProfile(employee);

      const isPrivileged = isPrivilegedRole(authUser.role);
      router.push(isPrivileged ? '/dashboard' : `/employees/${authUser.sub}`);
    },
    [router],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setProfile(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback((...roles: Role[]) => (user ? roles.includes(user.role) : false), [user]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
