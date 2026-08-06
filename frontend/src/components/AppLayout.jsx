import { NavLink } from 'react-router-dom';
import { Heart, Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout({ children }) {
  const { profile } = useAuth();

  const navItems = [
    {
      to: '/discover',
      icon: Search,
      label: 'Explorar',
    },
    {
      to: '/chat',
      icon: MessageCircle,
      label: 'Chat',
      disabled: !profile?.has_active_match,
      badge: profile?.has_active_match,
    },
    {
      to: '/profile',
      icon: User,
      label: 'Perfil',
    },
  ];

  return (
    <div className="h-dvh bg-[#0a0a0f] flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-center px-6 py-4 border-b border-[rgba(139,92,246,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-400 fill-red-400" />
          <span className="text-lg font-bold font-heading gradient-text">OneMatch</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-4 py-3 border-t border-[rgba(139,92,246,0.15)] bg-[#12121a] flex-shrink-0">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.disabled ? '#' : item.to}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative ${
                item.disabled
                  ? 'opacity-30 cursor-not-allowed'
                  : isActive
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''}`} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#12121a]" />
                  )}
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-3 w-6 h-0.5 rounded-full gradient-bg" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
