import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/lobby" className="flex items-center space-x-2">
            
            <img src="src/components/image.png" alt="" className='h-22 w-16 mr-12 ' />
           
          </Link>
          <span className="text-4xl font-bold text-center">CodeGamb</span>
          {currentUser && (
            <div className="flex items-center">
              <div className="hidden md:flex space-x-6 mr-8">
                <NavLink to="/lobby" current={location.pathname === '/lobby'}>Lobby</NavLink>
                <NavLink to="/leaderboard" current={location.pathname === '/leaderboard'}>Leaderboard</NavLink>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Trophy size={18} className="text-yellow-300 mr-2" />
                  <span className="font-medium">{currentUser.points} pts</span>
                </div>
                
                <div className="hidden md:block text-sm px-3 py-1 bg-green-800 rounded-full">
                  {currentUser.username}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-green-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  current: boolean;
  children: React.ReactNode;
}

function NavLink({ to, current, children }: NavLinkProps) {
  return (
    <Link to={to} className="relative">
      <span className="py-1">{children}</span>
      {current && (
        <motion.div
          layoutId="navbar-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  );
}