export interface MockUser {
  name: string;
  email: string;
  picture?: string;
}

export interface SessionContextValue {
  isAuthenticated: boolean;
  user: MockUser;
}

const mockUser: MockUser = {
  name: 'Demo User',
  email: 'demo@gocrisp.com',
};

export function useSession(): SessionContextValue {
  return {
    isAuthenticated: true,
    user: mockUser,
  };
}
