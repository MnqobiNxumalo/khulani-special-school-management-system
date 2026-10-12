import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Visitors = () => {
  const { user } = useAuth();
  const [active, setActive] = useState([]);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('active');

  const canDelete = user?.role === 'principal';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [activeRes, todayRes] = await Promise.all([
        api.get('/visitors/active'),
        api.get('/visitors/today'),
      ]);
      setActive(activeRes.data);
      setToday(todayRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visitor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds for updated on-site times
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckOut = async (id, name) => {
    if (!window.confirm(`Check out ${name}?`)) return;

    try {
      await api.put(`/visitors/${id}/checkout`);
      setSuccess(`${name} checked out successfully.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out visitor');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete visitor record for ${name}?`)) return;

    try {
      await api.delete(`/visitors/${id}`);
      setSuccess('Visitor record deleted.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    if (refresh) {
      fetchData();
      setSuccess('Visitor checked in successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const currentList = tab === 'active' ? active : today;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitors</h1>
          <p className="text-gray-600 mt-1">
            Security check-in and on-site tracking
            {active.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {active.length} on-site now
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          🚪 Check In Visitor
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-xs font-medium text-green-600 uppercase">On-Site</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{active.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-600 uppercase">Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{today.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-600 uppercase">Checked Out</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {today.filter((v) => v.checkOutTime).length}
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-primary-600 uppercase">Avg Duration</p>
          <p className="text-2xl font-bold text-primary-700 mt-1">
            {today.length > 0
              ? formatDuration(
                  Math.round(
                    today.reduce((sum, v) => sum + v.minutesOnSite, 0) / today.length
                  )
                )
              : '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-1 inline-flex">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'active'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          🟢 Currently On-Site ({active.length})
        </button>
        <button
          onClick={() => setTab('today')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'today'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          📅 Today's Log ({today.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🚪</div>
          <p className="text-gray-600 mb-2">
            {tab === 'active'
              ? 'No visitors currently on-site'
              : 'No visitors today'}
          </p>
          <p className="text-sm text-gray-500">
            {tab === 'active'
              ? 'All checked-in visitors appear here until they check out.'
              : 'Check in a visitor to record their arrival.'}
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            Check in the first visitor
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                {(canDelete || tab === 'active') && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentList.map((visitor) => (
                <tr
                  key={visitor.visitorId}
                  className={`hover:bg-gray-50 ${
                    visitor.isCurrentlyOnSite ? 'bg-green-50/50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                        {visitor.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {visitor.fullName}
                        </p>
                        {visitor.phone && (
                          <p className="text-xs text-gray-500">{visitor.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    {visitor.purpose || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(visitor.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {visitor.checkOutTime ? (
                      <span className="text-gray-700">
                        {formatDateTime(visitor.checkOutTime)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        🟢 On-Site
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDuration(visitor.minutesOnSite)}
                  </td>
                  {(canDelete || tab === 'active') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {visitor.isCurrentlyOnSite && (
                        <button
                          onClick={() =>
                            handleCheckOut(visitor.visitorId, visitor.fullName)
                          }
                          className="text-primary-600 hover:text-primary-800 mr-4 font-medium"
                        >
                          Check Out
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() =>
                            handleDelete(visitor.visitorId, visitor.fullName)
                          }
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && <CheckInModal onClose={handleModalClose} />}
    </div>
  );
};

// ============================================================
// CheckInModal component
// ============================================================
const CheckInModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    purpose: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post('/visitors/checkin', formData);
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to check in visitor');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const quickReasons = [
    'Parent/Guardian visit',
    'Department official',
    'Medical check-up',
    'Delivery',
    'Maintenance',
    'Meeting with Principal',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Check In Visitor</h2>
          <p className="text-sm text-gray-500 mt-1">
            Register the visitor's arrival for security records
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              maxLength={200}
              className="input-field"
              placeholder="e.g., Dr. Sipho Mthembu"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
              className="input-field"
              placeholder="e.g., 0825551234"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              maxLength={500}
              className="input-field"
              placeholder="e.g., Routine medical check-up"
            />
            {/* Quick select chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFormData({ ...formData, purpose: reason })}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-primary-100 text-xs text-gray-700 hover:text-primary-800 rounded-full transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Checking in...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Visitors;