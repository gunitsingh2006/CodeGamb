import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Code } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    // For demo purposes, only allow login as one of the two temporary users
    if (username.toLowerCase() === 'player one' || username.toLowerCase() === 'player two') {
      login(username);
      setError('');
    } else {
      setError('Please login as "Player One" or "Player Two" for this demo');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-700 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
           <img src="src/components/image.png" alt="" className='h-22 w-16'/>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">CodeGamb</h1>
          <p className="text-xl text-gray-600 mt-2">"Think. Solve. Dominate."</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Enter Player One or Player Two"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-red-600"
              >
                {error}
              </motion.p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Sign In
          </motion.button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For this demo, please login as either:</p>
          <div className="mt-2 font-medium text-gray-700">
            <p>Player One</p>
            <p>Player Two</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}