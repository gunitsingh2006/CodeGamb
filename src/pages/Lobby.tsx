import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { UserPlus, Clock, AlertTriangle } from 'lucide-react';

export default function Lobby() {
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [error, setError] = useState('');
  
  // Join the lobby
  const handleJoinLobby = () => {
    if (!socket) {
      setError('Connection issue. Please try again.');
      return;
    }
    
    setIsJoiningLobby(true);
    setError('');
    
    socket.emit('join_lobby', { userId: currentUser?.id });
    setIsInQueue(true);
  };
  
  // Cancel joining the lobby
  const handleCancelJoin = () => {
    if (socket) {
      socket.emit('leave_lobby', { userId: currentUser?.id });
    }
    setIsInQueue(false);
    setWaitTime(0);
  };
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Update wait time every second
    const waitInterval = setInterval(() => {
      if (isInQueue) {
        setWaitTime(prev => prev + 1);
      }
    }, 1000);
    
    // Listen for match_found event
    socket.on('match_found', ({ gameId }) => {
      navigate(`/game/${gameId}`);
    });
    
    // Listen for lobby_error event
    socket.on('lobby_error', ({ message }) => {
      setError(message);
      setIsInQueue(false);
      setWaitTime(0);
    });
    
    // Cleanup on unmount
    return () => {
      clearInterval(waitInterval);
      socket.off('match_found');
      socket.off('lobby_error');
      
      // Leave lobby if in queue
      if (isInQueue) {
        socket.emit('leave_lobby', { userId: currentUser?.id });
      }
    };
  }, [socket, isInQueue, currentUser, navigate]);
  
  // Format wait time to mm:ss format
  const formatWaitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="bg-green-600 px-6 py-5 text-white">
          <h1 className="text-2xl font-bold">Find a Coding Match</h1>
          <p className="text-green-200 mt-1">
            Join the lobby to get paired with another player
          </p>
        </div>
        
        <div className="p-6">
          {!isInQueue ? (
            <div className="text-center py-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Ready to compete?</h2>
                <p className="text-gray-600">
                  Test your coding skills against another player in real-time.
                  <br />Both players will receive the same challenge.
                </p>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4 mb-8">
                <h3 className="font-medium text-green-800 mb-2">How it works:</h3>
                <ul className="text-gray-700 text-sm space-y-2 text-left">
                  <li>• You'll stake 2 points to enter the match</li>
                  <li>• Winner receives 3 points (1 point goes to platform)</li>
                  <li>• First to submit correct solution wins</li>
                  <li>• You'll have a time limit to solve the problem</li>
                </ul>
              </div>
              
              {error && (
                <div className="mb-6 flex items-center justify-center text-red-600 bg-red-50 py-3 px-4 rounded-lg">
                  <AlertTriangle size={18} className="mr-2" />
                  <span>{error}</span>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinLobby}
                disabled={isJoiningLobby}
                className="bg-green-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md flex items-center justify-center mx-auto"
              >
                <UserPlus size={20} className="mr-2" />
                {isJoiningLobby ? 'Joining...' : 'Join Lobby'}
              </motion.button>
            </div>
          ) : (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative mb-8 mx-auto w-32 h-32 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-green-500 animate-spin"
                  style={{ 
                    borderRightColor: 'transparent',
                    borderLeftColor: 'transparent',
                    animationDuration: '3s'
                  }}
                ></div>
                <Clock size={40} className="text-green-600" />
              </motion.div>
              
              <h2 className="text-xl font-semibold mb-2">Finding a match...</h2>
              <p className="text-gray-600 mb-1">Waiting for another player</p>
              <p className="text-gray-500 flex items-center justify-center">
                <Clock size={16} className="mr-1" />
                <span>{formatWaitTime(waitTime)}</span>
              </p>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelJoin}
                className="mt-8 bg-white border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}