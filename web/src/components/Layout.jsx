import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
  { path: '/', label: 'Dashboard', icon: '📊', roles: ['principal', 'admin', 'teacher', 'parent'] },
  { path: '/learners', label: 'Learners', icon: '👨‍🎓', roles: ['principal', 'admin', 'teacher'] },
  { path: '/health-incidents', label: 'Health Incidents', icon: '🏥', roles: ['principal', 'admin', 'teacher', 'parent'] },
  { path: '/attendance', label: 'Attendance', icon: '✅', roles: ['principal', 'admin', 'teacher', 'parent'] },
  { path: '/messages', label: 'Messages', icon: '💬', roles: ['principal', 'admin', 'teacher', 'parent'] },
  { path: '/visitors', label: 'Visitors', icon: '🚪', roles: ['principal', 'admin', 'teacher'] },
  { path: '/staff', label: 'Staff', icon: '👥', roles: ['principal', 'admin'] },
];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg text-primary-700">KSSMCS</h1>
              <p className="text-xs text-gray-500">Khulani Special School</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allNavItems
  .filter((item) => item.roles.includes(user?.role))
  .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-200">
          {sidebarOpen ? (
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;