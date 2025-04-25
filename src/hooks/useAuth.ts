
"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { User, Role } from '@/types/user';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[]; // Expose users for management (admin only)
  addUser: (user: Omit<User, 'id'>) => boolean;
  deleteUser: (userId: string) => void;
  checkRole: (allowedRoles: Role[]) => boolean;
  isLoading: boolean; // Indicates if auth state is being determined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial default admin user if no users exist in local storage
const defaultAdminUser: User = {
    id: 'admin-001',
    username: 'admin',
    password: 'password', // Default insecure password
    role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [users, setUsers] = useLocalStorage<User[]>('appUsers', []);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const router = useRouter();
  const pathname = usePathname();

   // Initialize users with default admin if none exist
   useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedUsers = window.localStorage.getItem('appUsers');
        if (!storedUsers || JSON.parse(storedUsers).length === 0) {
            setUsers([defaultAdminUser]);
            console.log("Initialized with default admin user.");
        }
        // Finish loading once users are checked/initialized
        setIsLoading(false);
    }
   }, [setUsers]); // Run only once on mount


  // Redirect logic based on auth state and current path
  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const isAuthPage = pathname === '/login';
    const isAdminPage = pathname.startsWith('/admin');

    if (!currentUser && !isAuthPage) {
      // Not logged in and not on login page -> redirect to login
      router.push('/login');
    } else if (currentUser && isAuthPage) {
      // Logged in but on login page -> redirect to home
      router.push('/');
    } else if (currentUser && currentUser.role !== 'admin' && isAdminPage) {
       // Logged in user is not admin but trying to access admin page -> redirect to home
       router.push('/');
    }
  }, [currentUser, pathname, router, isLoading]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username === username && u.password === password); // Plain text comparison (INSECURE)
    if (user) {
      setCurrentUser(user);
      router.push('/'); // Redirect to home after successful login
      return true;
    }
    setCurrentUser(null); // Ensure logged out state if login fails
    return false;
  }, [users, setCurrentUser, router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    router.push('/login'); // Redirect to login after logout
  }, [setCurrentUser, router]);

  const addUser = useCallback((newUser: Omit<User, 'id'>): boolean => {
    // Basic validation: Check if username already exists
    if (users.some(u => u.username === newUser.username)) {
      console.error("Username already exists");
      return false; // Indicate failure
    }
    const userWithId: User = { ...newUser, id: Date.now().toString() };
    setUsers(prevUsers => [...prevUsers, userWithId]);
    return true; // Indicate success
  }, [users, setUsers]);

   const deleteUser = useCallback((userId: string) => {
      // Prevent deleting the currently logged-in user or the default admin if it's the only admin
      if (currentUser?.id === userId) {
          console.error("Cannot delete the currently logged-in user.");
          return;
      }
       const userToDelete = users.find(u => u.id === userId);
       const adminUsers = users.filter(u => u.role === 'admin');

       if (userToDelete?.role === 'admin' && adminUsers.length <= 1) {
            console.error("Cannot delete the last admin user.");
            return;
       }


      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
   }, [users, setUsers, currentUser]);

   const checkRole = useCallback((allowedRoles: Role[]): boolean => {
      return !!currentUser && allowedRoles.includes(currentUser.role);
   }, [currentUser]);


  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    users,
    addUser,
    deleteUser,
    checkRole,
    isLoading,
  };

  // Return the provider wrapping the children
  // Ensure the JSX syntax is correct here. It seems standard.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
