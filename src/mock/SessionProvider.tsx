import React, { createContext, useContext } from 'react';

interface SessionContextValue {
  isSessionReady: boolean;
  refreshSession: () => Promise<void>;
  availableTenants: { uid: string; name: string }[];
  clientUid: string | null;
  clientShortCode: string | null;
  user: { name: string; email: string; picture?: string };
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};

export const MockSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionContext.Provider
      value={{
        isSessionReady: true,
        refreshSession: async () => {},
        availableTenants: [{ uid: 'tenant-001', name: 'Demo Client' }],
        clientUid: 'tenant-001',
        clientShortCode: 'DEMO',
        user: { name: 'Demo User', email: 'demo@gocrisp.com' },
        isAdmin: true,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
