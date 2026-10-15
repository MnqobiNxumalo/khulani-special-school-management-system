import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [desktopCollapsed, setDesktopCollapsed] = useState(false); // desktop sidebar

  // Close mobile drawer when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close mobile drawer when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['principal', 'admin', 'teacher'] },
    { path: '/learners', label: 'Learners', icon: '👨‍🎓', roles: ['principal', 'admin', 'teacher'] },
    { path: '/health-incidents', label: 'Health Incidents', icon: '🏥', roles: ['principal', 'admin', 'teacher'] },
    { path: '/attendance', label: 'Attendance', icon: '✅', roles: ['principal', 'admin', 'teacher'] },
    { path: '/messages', label: 'Messages', icon: '💬', roles: ['principal', 'admin', 'teacher'] },
    { path: '/visitors', label: 'Visitors', icon: '🚪', roles: ['principal', 'admin'] },
    { path: '/staff', label: 'Staff', icon: '👥', roles: ['principal', 'admin'] },
    { path: '/parent', label: 'My Child', icon: '👨‍👩‍👧', roles: ['parent'] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role));

  const sidebarWidth = desktopCollapsed ? 'lg:w-20' : 'lg:w-64';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'w-64' : sidebarWidth}
          bg-white border-r border-gray-200 flex flex-col transition-transform lg:transition-all duration-200
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          {(!desktopCollapsed || sidebarOpen) && (
            <div className="min-w-0">
              <h1 className="font-bold text-lg text-primary-700 truncate">KSSMCS</h1>
              <p className="text-xs text-gray-500 truncate">Khulani Special School</p>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Close menu"
          >
            ✕
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="hidden lg:block p-1 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Toggle sidebar"
          >
            {desktopCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {(!desktopCollapsed || sidebarOpen) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          {!desktopCollapsed || sidebarOpen ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Logout"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-3 min-w-0">
            <h1 className="font-bold text-primary-700 truncate">KSSMCS</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;