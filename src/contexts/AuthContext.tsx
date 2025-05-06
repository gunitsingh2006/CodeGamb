import { createContext, useState, useEffect, ReactNode } from 'react';

// Define types
export interface User {
  id: string;
  username: string;
  points: number;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
  updatePoints: (newPoints: number) => void;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updatePoints: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Temporary users for the demo
const TEMP_USERS = [
  { id: 'user1', username: 'Player One', points: 100 },
  { id: 'user2', username: 'Player Two', points: 100 }
];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  // Login function - simplified for demo purposes
  const login = (username: string) => {
    // Find temp user by username (case insensitive)
    const user = TEMP_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Update user's points
  const updatePoints = (newPoints: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, points: newPoints };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, updatePoints }}>
      {children}
    </AuthContext.Provider>
  );
};