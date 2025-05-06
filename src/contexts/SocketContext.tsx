import { createContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// Define types
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Create context with default values
export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect to socket if user is authenticated
    if (isAuthenticated && currentUser) {
      // Connect to the Socket.IO server
      const newSocket = io('http://localhost:3002', {
        auth: {
          userId: currentUser.id,
          username: currentUser.username,
        },
      });

      // Set up event listeners
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to socket server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from socket server');
      });

      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
    
    return () => {};
  }, [isAuthenticated, currentUser]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};