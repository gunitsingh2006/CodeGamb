import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-green-600 text-white py-4 text-center">
        <p className="text-sm">© 2025 CodeGamb - Challenge your coding skills in real-time!</p>
      </footer>
    </div>
  );
}