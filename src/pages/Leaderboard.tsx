import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Trophy, Clock, Terminal, User } from 'lucide-react';

// Player type
interface PlayerStats {
  userId: string;
  username: string;
  points: number;
  wins: number;
  losses: number;
  totalMatches: number;
}

// Match history type
interface Match {
  id: string;
  date: string;
  players: {
    userId: string;
    username: string;
  }[];
  winnerId: string;
  winnerUsername: string;
  challengeTitle: string;
  challengeDifficulty: string;
}

export default function Leaderboard() {
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch leaderboard and match history data
  useEffect(() => {
    if (!socket) return;
    
    setIsLoading(true);
    
    // Request leaderboard data
    socket.emit('get_leaderboard');
    
    // Request match history
    socket.emit('get_match_history', { userId: currentUser?.id });
    
    // Listen for leaderboard data
    socket.on('leaderboard_data', ({ players }) => {
      setLeaderboard(players);
      setIsLoading(false);
    });
    
    // Listen for match history data
    socket.on('match_history_data', ({ matches }) => {
      setMatchHistory(matches);
    });
    
    // Cleanup on unmount
    return () => {
      socket.off('leaderboard_data');
      socket.off('match_history_data');
    };
  }, [socket, currentUser]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate win rate
  const calculateWinRate = (wins: number, totalMatches: number) => {
    if (totalMatches === 0) return '0%';
    const rate = (wins / totalMatches) * 100;
    return `${rate.toFixed(0)}%`;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="bg-green-700 px-6 py-5 text-white">
          <h1 className="text-2xl font-bold">Leaderboard & Stats</h1>
          <p className="text-indigo-200 mt-1">
            View rankings and match history
          </p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'leaderboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Trophy size={16} className="mr-2" />
                Leaderboard
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                Match History
              </div>
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Leaderboard tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Player
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            W/L
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Win Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.map((player, index) => (
                          <tr 
                            key={player.userId}
                            className={player.userId === currentUser?.id ? 'bg-indigo-50' : ''}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 ? (
                                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800">
                                    <Trophy size={16} />
                                  </span>
                                ) : (
                                  <span className="text-gray-900 font-medium">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User size={20} className="text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {player.username}
                                    {player.userId === currentUser?.id && (
                                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{player.points}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {player.wins}W - {player.losses}L
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {calculateWinRate(player.wins, player.totalMatches)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Match history tab */}
              {activeTab === 'history' && (
                <div>
                  {matchHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Terminal size={40} className="mx-auto mb-4 text-gray-400" />
                      <p>No matches played yet.</p>
                      <p className="text-sm mt-2">Join the lobby to start playing!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matchHistory.map((match) => (
                        <div 
                          key={match.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between">
                            <div className="text-sm text-gray-500">
                              {formatDate(match.date)}
                            </div>
                            <div className="text-sm font-medium">
                              {match.challengeDifficulty} Challenge
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-2">
                              {match.challengeTitle}
                            </h3>
                            
                            <div className="flex flex-wrap items-center justify-between">
                              <div className="flex items-center space-x-6">
                                {match.players.map((player) => (
                                  <div 
                                    key={player.userId}
                                    className={`flex items-center ${
                                      player.userId === match.winnerId
                                        ? 'text-green-600'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <User size={16} className="mr-2" />
                                    <span>
                                      {player.username}
                                      {player.userId === currentUser?.id && ' (You)'}
                                    </span>
                                    {player.userId === match.winnerId && (
                                      <Trophy size={16} className="ml-2 text-yellow-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-2 sm:mt-0 text-sm font-medium">
                                <span className="text-indigo-600">
                                  Winner: {match.winnerUsername}
                                  {match.winnerId === currentUser?.id && ' (You)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}