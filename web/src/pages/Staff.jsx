import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  principal: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  teacher: 'bg-green-100 text-green-700',
  parent: 'bg-yellow-100 text-yellow-700',
};

const ROLE_ICONS = {
  principal: '👑',
  admin: '⚙️',
  teacher: '👨‍🏫',
  parent: '👨‍👩‍👧',
};

const Staff = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');

  const canDelete = user?.role === 'principal';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (id, name, currentActive) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${name}?`)) return;

    try {
      await api.put(`/users/${id}/toggle-active`);
      setSuccess(`User ${action}d successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;

    try {
      await api.delete(`/users/${id}`);
      setSuccess(`User "${name}" deleted successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter((u) => u.role === filterRole);

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage staff accounts and access permissions
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add User
        </button>
      </div>

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

      <div className="mb-4 flex gap-2 flex-wrap">
        {['all', 'principal', 'admin', 'teacher', 'parent'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRole === role
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-600 mb-2">No users found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            Add the first user
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Learner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => {
                  const isSelf = u.userId === user.userId;
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {u.fullName}
                              {isSelf && (
                                <span className="ml-2 text-xs text-primary-600 font-normal">
                                  (You)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ROLE_ICONS[u.role]} {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.role === 'parent' ? (
                          u.linkedLearnerName ? (
                            <span className="text-gray-900">
                              👨‍🎓 {u.linkedLearnerName}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic text-xs">
                              ⚠️ Not linked
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            ✅ Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            🚫 Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  u.userId,
                                  u.fullName,
                                  u.isActive
                                )
                              }
                              className={`mr-4 font-medium ${
                                u.isActive
                                  ? 'text-amber-600 hover:text-amber-800'
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(u.userId, u.fullName)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {isSelf && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <CreateUserModal
          currentUserRole={user.role}
          onClose={(refresh) => {
            setShowModal(false);
            if (refresh) {
              fetchUsers();
              setSuccess('User created successfully.');
              setTimeout(() => setSuccess(''), 3000);
            }
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// CreateUserModal — with parent-learner linking
// ============================================================
const CreateUserModal = ({ currentUserRole, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'teacher',
    linkedLearnerId: '',
  });
  const [learners, setLearners] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isPrincipal = currentUserRole === 'principal';
  const isParentRole = formData.role === 'parent';

  // Load learners when role = parent
  useEffect(() => {
    if (isParentRole) {
      api.get('/learners')
        .then((res) => setLearners(res.data))
        .catch((err) => console.error('Failed to load learners:', err));
    }
  }, [isParentRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        linkedLearnerId: formData.linkedLearnerId || null,
      };
      await api.post('/users', payload);
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to create user');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pwd });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add User</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a new account with access to the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                maxLength={100}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                maxLength={100}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="staff@khulani.co.za"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="teacher">👨‍🏫 Teacher</option>
              {isPrincipal && (
                <>
                  <option value="admin">⚙️ Admin</option>
                  <option value="principal">👑 Principal</option>
                </>
              )}
              <option value="parent">👨‍👩‍👧 Parent</option>
            </select>
            {!isPrincipal && (
              <p className="text-xs text-gray-500 mt-1">
                Only principals can create admin or principal accounts.
              </p>
            )}
          </div>

          {isParentRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Learner *
              </label>
              <select
                name="linkedLearnerId"
                value={formData.linkedLearnerId}
                onChange={handleChange}
                required={isParentRole}
                className="input-field"
              >
                <option value="">Select their child...</option>
                {learners.map((l) => (
                  <option key={l.learnerId} value={l.learnerId}>
                    {l.firstName} {l.lastName} ({l.age} years)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The parent will only be able to see this learner's data.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Initial Password *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                🎲 Generate Password
              </button>
            </div>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="input-field font-mono"
              placeholder="Minimum 6 characters"
            />
          </div>

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
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Staff;