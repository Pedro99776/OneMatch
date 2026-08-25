import { NavLink } from 'react-router-dom';
import { Heart, Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavSidebar from './NavSidebar';

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
    <div className="h-dvh bg-[#0B0A10] flex overflow-hidden">
      
      {/* Desktop Sidebar */}
      <NavSidebar navItems={navItems} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Mobile Only */}
        <header className="md:hidden flex items-center justify-center px-6 py-4 border-b border-[rgba(139,92,246,0.15)] bg-[#0B0A10] flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
            <span className="text-lg font-bold font-heading gradient-text">OneMatch</span>
          </div>
        </header>

        {/* Content Centered Wrapper */}
        <main className="flex-1 overflow-y-auto flex flex-col items-center bg-[#0B0A10]">
          <div className="w-full max-w-[600px] flex-1 flex flex-col relative">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Mobile Only */}
        <nav className="md:hidden flex items-center justify-around px-4 pb-safe pt-3 border-t border-[rgba(139,92,246,0.15)] bg-[#15141C] flex-shrink-0 z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.disabled ? '#' : item.to}
              onClick={(e) => item.disabled && e.preventDefault()}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative pb-2 ${
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
                    <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]' : ''}`} />
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#15141C]" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-8 h-1 rounded-t-full gradient-bg" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
