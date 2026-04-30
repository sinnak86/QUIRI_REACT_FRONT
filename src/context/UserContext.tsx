import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CurrentUser } from '@/types/user';

interface UserContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isAdmin: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
