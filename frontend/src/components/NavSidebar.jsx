import { NavLink } from 'react-router-dom';
import { Heart, Search, MessageCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NavSidebar({ navItems }) {
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-[rgba(139,92,246,0.15)] bg-[#0B0A10] h-full flex-shrink-0 z-20">
      <div className="flex items-center justify-center lg:justify-start gap-3 p-6 h-[72px]">
        <Heart className="w-8 h-8 text-purple-500 fill-purple-500 flex-shrink-0" />
        <span className="text-2xl font-bold font-heading gradient-text hidden lg:block">OneMatch</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.disabled ? '#' : item.to}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : isActive
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex-shrink-0">
                  <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]' : ''}`} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#0B0A10]" />
                  )}
                </div>
                <span className={`font-medium hidden lg:block ${isActive ? 'text-purple-300' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[rgba(139,92,246,0.15)]">
        <button
          onClick={logout}
          className="flex items-center justify-center lg:justify-start gap-4 px-4 py-3 w-full rounded-2xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-6 h-6 flex-shrink-0" />
          <span className="font-medium hidden lg:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
