import { NavLink } from 'react-router-dom';
import { Heart, Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NavSidebar from './NavSidebar';

export default function AppLayout({ children, disableScroll = false }) {
  const { profile } = useAuth();

  const navItems = [
    {
      to: '/discover',
      icon: Search,
      label: 'Explorar',
      disabled: profile?.has_active_match,
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
    <div className="fixed inset-0 bg-[#0B0A10] flex overflow-hidden">
      
      {/* Desktop Sidebar */}
      <NavSidebar navItems={navItems} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar Mobile Only */}
        <header 
          className="md:hidden flex items-center justify-center px-6 pb-4 border-b border-[rgba(139,92,246,0.15)] bg-[#0B0A10] flex-shrink-0 z-10"
          style={{ paddingTop: 'calc(var(--sat) + 16px)' }}
        >
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="OneMatch" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold font-heading gradient-text">OneMatch</span>
          </div>
        </header>

        {/* Content Centered Wrapper */}
        <main className={`flex-1 ${disableScroll ? 'overflow-hidden' : 'overflow-y-auto'} flex flex-col items-center bg-[#0B0A10] hide-scrollbar`}>
          <div className="w-full max-w-[600px] flex-1 flex flex-col relative">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Mobile Only */}
        <nav 
          className="md:hidden flex items-center justify-around px-4 pt-3 border-t border-[rgba(139,92,246,0.15)] bg-[#15141C] flex-shrink-0 z-10"
          style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.disabled ? '#' : item.to}
              onClick={(e) => item.disabled && e.preventDefault()}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative pb-2 ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
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
                    {/* Linha de negação (Disabled State) */}
                    {item.disabled && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-0.5 bg-red-500/80 -rotate-45 rounded-full shadow-sm" />
                      </div>
                    )}
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#15141C]" />
                    )}
                  </div>
                  <span className={`text-[11px] font-medium ${item.disabled ? 'line-through decoration-red-500/50' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && !item.disabled && (
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
