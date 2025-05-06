import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Clock, Play, User, Award, AlertTriangle } from 'lucide-react';

// Game states
type GameState = 'waiting' | 'countdown' | 'playing' | 'finished';

// Player status type
interface PlayerStatus {
  userId: string;
  username: string;
  isConnected: boolean;
  submitted: boolean;
}

// Result type
interface GameResult {
  winnerId: string;
  winnerUsername: string;
  solution: string;
  executionTime: number;
}

export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket } = useSocket();
  const { currentUser, updatePoints } = useAuth();
  const navigate = useNavigate();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [countdown, setCountdown] = useState(5);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  
  // Challenge and code
  const [challenge, setChallenge] = useState({
    title: '',
    description: '',
    examples: [],
    constraints: '',
    difficulty: ''
  });
  const [code, setCode] = useState('// Write your solution here');
  
  // Players
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [opponent, setOpponent] = useState<PlayerStatus | null>(null);
  
  // Results
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up the game when component mounts
  useEffect(() => {
    if (!socket || !gameId) return;
    
    // Join game room
    socket.emit('join_game', { gameId, userId: currentUser?.id });
    
    // Listen for game events
    socket.on('game_state', ({ state, players: gamePlayers, challenge: gameChallenge, timeLeft: remainingTime }) => {
      setGameState(state);
      setPlayers(gamePlayers);
      
      // Find opponent
      const opponentPlayer = gamePlayers.find(p => p.userId !== currentUser?.id) || null;
      setOpponent(opponentPlayer);
      
      if (gameChallenge) {
        setChallenge(gameChallenge);
      }
      
      if (remainingTime !== undefined) {
        setTimeLeft(remainingTime);
      }
    });
    
    socket.on('countdown_update', ({ count }) => {
      setCountdown(count);
      if (count === 0) {
        setGameState('playing');
      }
    });
    
    socket.on('time_update', ({ timeLeft: remainingTime }) => {
      setTimeLeft(remainingTime);
    });
    
    socket.on('player_submitted', ({ userId, username }) => {
      setPlayers(prev => 
        prev.map(p => 
          p.userId === userId 
            ? { ...p, submitted: true } 
            : p
        )
      );
    });
    
    socket.on('game_result', ({ winnerId, winnerUsername, solution, executionTime, pointsAdded }) => {
      setGameState('finished');
      setResult({ winnerId, winnerUsername, solution, executionTime });
      
      // Update points if current user is the winner
      if (currentUser && winnerId === currentUser.id && pointsAdded) {
        updatePoints(currentUser.points + pointsAdded);
      } else if (currentUser && pointsAdded) {
        // Loser loses 2 points
        updatePoints(currentUser.points - 2);
      }
    });
    
    socket.on('game_error', ({ message }) => {
      setError(message);
    });
    
    // Cleanup on unmount
    return () => {
      socket.emit('leave_game', { gameId, userId: currentUser?.id });
      socket.off('game_state');
      socket.off('countdown_update');
      socket.off('time_update');
      socket.off('player_submitted');
      socket.off('game_result');
      socket.off('game_error');
    };
  }, [socket, gameId, currentUser, updatePoints]);
  
  // Format time left to mm:ss format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Submit code
  const handleSubmit = () => {
    if (!socket || !gameId || !code.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    socket.emit('submit_code', {
      gameId,
      userId: currentUser?.id,
      code
    });
    
    // Listen for submission result
    socket.once('submission_result', ({ success, error: submissionError }) => {
      setIsSubmitting(false);
      
      if (!success && submissionError) {
        setError(submissionError);
      }
    });
  };
  
  // Return to lobby
  const handleReturnToLobby = () => {
    navigate('/lobby');
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
        <div className="bg-green-700 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{challenge.title || 'Coding Challenge'}</h1>
            <p className="text-indigo-200 text-sm">
              {challenge.difficulty ? `Difficulty: ${challenge.difficulty}` : 'Loading challenge...'}
            </p>
          </div>
          
          <div className="flex items-center">
            {gameState === 'waiting' && (
              <span className="bg-yellow-500 text-white text-sm py-1 px-3 rounded-full">Waiting for opponent</span>
            )}
            
            {gameState === 'countdown' && (
              <div className="bg-amber-500 text-white text-sm py-1 px-3 rounded-full">
                Starting in {countdown}...
              </div>
            )}
            
            {(gameState === 'playing' || gameState === 'finished') && (
              <div className={`flex items-center ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`}>
                <Clock size={18} className="mr-1" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4">
          {gameState === 'waiting' ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
              ></motion.div>
              <p className="text-gray-600">Waiting for opponent to join...</p>
            </div>
          ) : (
            <>
              {/* Players */}
              <div className="flex flex-wrap gap-4 mb-4">
                {players.map(player => (
                  <div 
                    key={player.userId}
                    className={`flex items-center py-2 px-4 rounded-lg ${
                      player.userId === currentUser?.id 
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <User size={16} className="mr-2" />
                    <span className="font-medium">
                      {player.username} {player.userId === currentUser?.id && '(You)'}
                    </span>
                    {player.submitted && (
                      <span className="ml-2 text-xs bg-green-500 text-white py-0.5 px-2 rounded-full">
                        Submitted
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Challenge description */}
              <div className="mb-4">
                <div className="prose max-w-none">
                  <p>{challenge.description}</p>
                  
                  {challenge.examples && challenge.examples.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-lg">Examples:</h3>
                      <div className="space-y-3">
                        {challenge.examples.map((example: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p><strong>Input:</strong> {example.input}</p>
                            <p><strong>Output:</strong> {example.output}</p>
                            {example.explanation && <p><strong>Explanation:</strong> {example.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {challenge.constraints && (
                    <div className="mt-4">
                      <h3 className="font-medium text-lg">Constraints:</h3>
                      <p>{challenge.constraints}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Code editor */}
      {gameState !== 'waiting' && (
        <div className="flex-grow bg-white rounded-xl shadow-lg overflow-hidden mb-4">
          <div className="border-b border-gray-200 px-4 py-2 flex justify-between items-center">
            <h2 className="font-medium">Solution</h2>
            
            {gameState === 'playing' && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-md flex items-center text-sm transition-colors"
              >
                <Play size={16} className="mr-1" />
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 flex items-start">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {gameState === 'finished' && result && (
            <div className={`px-4 py-3 ${
              result.winnerId === currentUser?.id 
                ? 'bg-green-50 text-green-700' 
                : 'bg-amber-50 text-amber-700'
            }`}>
              <div className="flex items-center">
                <Award size={20} className="mr-2" />
                <span className="font-medium">
                  {result.winnerId === currentUser?.id 
                    ? 'You won! +3 points' 
                    : `${result.winnerUsername} won. You lost 2 points.`}
                </span>
              </div>
            </div>
          )}
          
          <div className="h-96">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={result?.solution || code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                readOnly: gameState === 'finished'
              }}
            />
          </div>
          
          {gameState === 'finished' && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleReturnToLobby}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-md transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}