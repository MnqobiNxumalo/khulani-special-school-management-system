import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [learnersRes, incidentsRes, messagesRes, visitorsRes] =
          await Promise.all([
            api.get('/learners/count'),
            api.get('/healthincidents/count'),
            api.get('/messages/unread-count'),
            api.get('/visitors/active'),
          ]);

        setStats({
          learners: learnersRes.data.count,
          incidents: incidentsRes.data.count,
          messages: messagesRes.data.count,
          visitors: visitorsRes.data.length,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Learners', value: stats.learners, icon: '👨‍🎓', color: 'bg-blue-500' },
    { label: 'Health Incidents', value: stats.incidents, icon: '🏥', color: 'bg-red-500' },
    { label: 'Unread Messages', value: stats.messages, icon: '💬', color: 'bg-green-500' },
    { label: 'Visitors On-Site', value: stats.visitors, icon: '🚪', color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening at Khulani Special School today.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Tips
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Use <strong>Learners</strong> to manage student profiles and medical information.</li>
          <li>• Log <strong>Health Incidents</strong> immediately when they occur for the safety record.</li>
          <li>• Mark <strong>Attendance</strong> daily — it tracks present, absent, and late learners.</li>
          <li>• Use <strong>Messages</strong> to communicate with other staff about specific learners.</li>
          <li>• Check visitors in and out at the <strong>Visitors</strong> station for security records.</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;