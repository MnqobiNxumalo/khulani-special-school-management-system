import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    learners: 0,
    incidents: 0,
    messages: 0,
    visitors: 0,
  });
  const [loading, setLoading] = useState(true);

  if (user?.role === 'parent') {
    return <Navigate to="/parent" replace />;
  }

  const canViewVisitors = ['principal', 'admin'].includes(user?.role);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch the stats that ALL staff roles can see
        const requests = [
          api.get('/learners/count'),
          api.get('/healthincidents/count'),
          api.get('/messages/unread-count'),
        ];

        // Only request visitor stats if the user has permission
        if (canViewVisitors) {
          requests.push(api.get('/visitors/active'));
        }

        const responses = await Promise.all(requests);

        setStats({
          learners: responses[0].data.count,
          incidents: responses[1].data.count,
          messages: responses[2].data.count,
          visitors: canViewVisitors ? responses[3].data.length : 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = [
    { label: 'Total Learners', value: stats.learners, icon: '👨‍🎓', color: 'bg-blue-500' },
    { label: 'Health Incidents', value: stats.incidents, icon: '🏥', color: 'bg-red-500' },
    { label: 'Unread Messages', value: stats.messages, icon: '💬', color: 'bg-green-500' },
    // Only show Visitors card for principal/admin
    ...(canViewVisitors
      ? [{ label: 'Visitors On-Site', value: stats.visitors, icon: '🚪', color: 'bg-purple-500' }]
      : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Here's what's happening at Khulani Special School today.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div
          className={`grid gap-3 md:gap-6 ${
            canViewVisitors
              ? 'grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {statCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`${card.color} w-9 h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-lg md:text-2xl flex-shrink-0`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 md:mt-8 card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Use <strong>Learners</strong> to manage student profiles and medical information.</li>
          <li>• Log <strong>Health Incidents</strong> immediately when they occur for the safety record.</li>
          <li>• Mark <strong>Attendance</strong> daily — it tracks present, absent, and late learners.</li>
          <li>• Use <strong>Messages</strong> to communicate with other staff about specific learners.</li>
          {canViewVisitors && (
            <li>• Check visitors in and out at the <strong>Visitors</strong> station for security records.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;