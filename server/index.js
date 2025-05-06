import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:5173", // Vite dev server
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory data stores
const users = [
  { id: 'user1', username: 'Player One', points: 100, wins: 5, losses: 2, totalMatches: 7 },
  { id: 'user2', username: 'Player Two', points: 100, wins: 3, losses: 4, totalMatches: 7 }
];

const lobbyQueue = [];
const activeGames = new Map();
const matchHistory = [];

// Sample coding challenges
const codingChallenges = [
  {
    id: 'challenge1',
    title: 'Two Sum',
    description: 'Given an array of integers and a target sum, return the indices of the two numbers such that they add up to the target.',
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] = 2 + 7 = 9'
      }
    ],
    constraints: '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9',
    difficulty: 'Easy',
    starterCode: '// Write a function that returns the indices of two numbers that add up to target\n\nfunction twoSum(nums, target) {\n  // Your code here\n}',
    testCases: [
      { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
      { nums: [3, 2, 4], target: 6, expected: [1, 2] }
    ]
  },
  {
    id: 'challenge2',
    title: 'Valid Parentheses',
    description: 'Given a string containing just the characters (, ), {, }, [ and ], determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.',
    examples: [
      {
        input: 's = "()"',
        output: 'true'
      },
      {
        input: 's = "()[]{}"',
        output: 'true'
      },
      {
        input: 's = "(]"',
        output: 'false'
      }
    ],
    constraints: '1 <= s.length <= 10^4, s consists of parentheses only ()',
    difficulty: 'Medium',
    starterCode: '// Write a function that returns true if the parentheses are valid\n\nfunction isValid(s) {\n  // Your code here\n}',
    testCases: [
      { s: "()", expected: true },
      { s: "()[]{}", expected: true },
      { s: "(]", expected: false }
    ]
  }
];

// Socket connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Extract user data from auth
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.auth.username;
  
  // Join lobby handler
  socket.on('join_lobby', ({ userId }) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      socket.emit('lobby_error', { message: 'User not found' });
      return;
    }
    
    const existingUser = lobbyQueue.find(u => u.userId === userId);
    if (existingUser) {
      socket.emit('lobby_error', { message: 'Already in queue' });
      return;
    }
    
    lobbyQueue.push({ userId, socketId: socket.id });
    console.log(`${user.username} joined the lobby`);
    
    if (lobbyQueue.length >= 2) {
      const player1 = lobbyQueue.shift();
      const player2 = lobbyQueue.shift();
      createNewGame(player1, player2);
    }
  });
  
  // Leave lobby handler
  socket.on('leave_lobby', ({ userId }) => {
    const index = lobbyQueue.findIndex(u => u.userId === userId);
    if (index !== -1) {
      lobbyQueue.splice(index, 1);
      console.log(`User ${userId} left the lobby`);
    }
  });
  
  // Join game handler
  socket.on('join_game', ({ gameId, userId }) => {
    const game = activeGames.get(gameId);
    if (!game) {
      socket.emit('game_error', { message: 'Game not found' });
      return;
    }
    
    socket.join(gameId);
    
    const playerIndex = game.players.findIndex(p => p.userId === userId);
    if (playerIndex !== -1) {
      game.players[playerIndex].isConnected = true;
      game.players[playerIndex].socketId = socket.id;
    }
    
    const allConnected = game.players.every(p => p.isConnected);
    
    if (game.state === 'waiting' && allConnected) {
      game.state = 'countdown';
      startGameCountdown(gameId);
    }
    
    socket.emit('game_state', {
      state: game.state,
      players: game.players,
      challenge: game.challenge,
      timeLeft: game.timeLeft
    });
  });
  
  // Leave game handler
  socket.on('leave_game', ({ gameId, userId }) => {
    socket.leave(gameId);
    
    const game = activeGames.get(gameId);
    if (!game) return;
    
    const playerIndex = game.players.findIndex(p => p.userId === userId);
    if (playerIndex !== -1) {
      game.players[playerIndex].isConnected = false;
    }
    
    if (game.state === 'playing') {
      const connectedPlayers = game.players.filter(p => p.isConnected);
      if (connectedPlayers.length < 2) {
        const remainingPlayer = connectedPlayers[0];
        if (remainingPlayer) {
          endGame(gameId, remainingPlayer.userId);
        } else {
          activeGames.delete(gameId);
        }
      }
    }
  });
  
  // Submit code handler
  socket.on('submit_code', ({ gameId, userId, code }) => {
    const game = activeGames.get(gameId);
    if (!game || game.state !== 'playing') {
      socket.emit('submission_result', { success: false, error: 'Game is not in progress' });
      return;
    }
    
    const playerIndex = game.players.findIndex(p => p.userId === userId);
    if (playerIndex === -1) {
      socket.emit('submission_result', { success: false, error: 'Player not found in game' });
      return;
    }
    
    // Simulate code evaluation
    setTimeout(() => {
      game.players[playerIndex].submitted = true;
      io.to(gameId).emit('player_submitted', { userId, username: game.players[playerIndex].username });
      socket.emit('submission_result', { success: true });
      endGame(gameId, userId, code);
    }, Math.random() * 1000 + 500);
  });
  
  // Get leaderboard handler
  socket.on('get_leaderboard', () => {
    const sortedUsers = [...users].sort((a, b) => b.points - a.points);
    socket.emit('leaderboard_data', { players: sortedUsers });
  });
  
  // Get match history handler
  socket.on('get_match_history', ({ userId }) => {
    const userMatches = matchHistory.filter(match => 
      match.players.some(p => p.userId === userId)
    );
    socket.emit('match_history_data', { matches: userMatches });
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const queueIndex = lobbyQueue.findIndex(u => u.socketId === socket.id);
    if (queueIndex !== -1) {
      lobbyQueue.splice(queueIndex, 1);
    }
    
    activeGames.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        game.players[playerIndex].isConnected = false;
        
        if (game.state === 'playing') {
          const connectedPlayers = game.players.filter(p => p.isConnected);
          if (connectedPlayers.length < 2) {
            const remainingPlayer = connectedPlayers[0];
            if (remainingPlayer) {
              endGame(gameId, remainingPlayer.userId);
            }
          }
        }
      }
    });
  });
});

// Game management functions
function createNewGame(player1, player2) {
  const gameId = uuidv4();
  
  const user1 = users.find(u => u.id === player1.userId);
  const user2 = users.find(u => u.id === player2.userId);
  
  if (!user1 || !user2) return;
  
  const challenge = codingChallenges[Math.floor(Math.random() * codingChallenges.length)];
  
  const game = {
    id: gameId,
    state: 'waiting',
    startTime: null,
    endTime: null,
    timeLeft: 600,
    challenge: {
      ...challenge,
      starterCode: challenge.starterCode || '// Write your solution here'
    },
    players: [
      { userId: user1.id, username: user1.username, socketId: player1.socketId, isConnected: false, submitted: false },
      { userId: user2.id, username: user2.username, socketId: player2.socketId, isConnected: false, submitted: false }
    ],
    winner: null,
    timer: null
  };
  
  activeGames.set(gameId, game);
  
  io.to(player1.socketId).emit('match_found', { gameId });
  io.to(player2.socketId).emit('match_found', { gameId });
  
  console.log(`New game created: ${gameId} with players ${user1.username} and ${user2.username}`);
}

function startGameCountdown(gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  let count = 5;
  io.to(gameId).emit('countdown_update', { count });
  
  const countdownInterval = setInterval(() => {
    count--;
    io.to(gameId).emit('countdown_update', { count });
    
    if (count <= 0) {
      clearInterval(countdownInterval);
      startGame(gameId);
    }
  }, 1000);
}

function startGame(gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  game.state = 'playing';
  game.startTime = new Date();
  
  io.to(gameId).emit('game_state', {
    state: 'playing',
    players: game.players,
    challenge: game.challenge,
    timeLeft: game.timeLeft
  });
  
  game.timer = setInterval(() => {
    game.timeLeft--;
    io.to(gameId).emit('time_update', { timeLeft: game.timeLeft });
    
    if (game.timeLeft <= 0) {
      clearInterval(game.timer);
      endGame(gameId, null);
    }
  }, 1000);
}

function endGame(gameId, winnerId, solution = '// No solution provided') {
  const game = activeGames.get(gameId);
  if (!game || game.state === 'finished') return;
  
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }
  
  game.state = 'finished';
  game.endTime = new Date();
  game.winner = winnerId;
  
  const winner = game.players.find(p => p.userId === winnerId);
  let pointsAdded = 0;
  
  if (winner) {
    const winnerUser = users.find(u => u.id === winnerId);
    if (winnerUser) {
      winnerUser.points += 3;
      winnerUser.wins += 1;
      pointsAdded = 3;
      
      const loser = game.players.find(p => p.userId !== winnerId);
      if (loser) {
        const loserUser = users.find(u => u.id === loser.userId);
        if (loserUser) {
          loserUser.points = Math.max(0, loserUser.points - 2);
          loserUser.losses += 1;
        }
      }
    }
    
    matchHistory.unshift({
      id: uuidv4(),
      date: new Date().toISOString(),
      players: game.players.map(p => ({ userId: p.userId, username: p.username })),
      winnerId: winner.userId,
      winnerUsername: winner.username,
      challengeTitle: game.challenge.title,
      challengeDifficulty: game.challenge.difficulty
    });
    
    if (matchHistory.length > 10) {
      matchHistory.pop();
    }
  }
  
  io.to(gameId).emit('game_result', {
    winnerId: winner?.userId,
    winnerUsername: winner?.username,
    solution,
    executionTime: winner ? Math.floor((new Date() - game.startTime) / 1000) : 0,
    pointsAdded
  });
  
  setTimeout(() => {
    activeGames.delete(gameId);
  }, 5 * 60 * 1000);
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});