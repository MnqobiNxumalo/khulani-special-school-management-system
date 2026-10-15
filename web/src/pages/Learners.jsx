import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Learners = () => {
  const { user } = useAuth();
  const [learners, setLearners] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLearner, setEditingLearner] = useState(null);

  const canEdit = ['principal', 'admin'].includes(user?.role);
  const canCreate = ['principal', 'admin', 'teacher'].includes(user?.role);
  const isTeacher = user?.role === 'teacher';

  const fetchLearners = async () => {
    setLoading(true);
    setError('');
    try {
      const url = search ? `/learners?search=${encodeURIComponent(search)}` : '/learners';
      const response = await api.get(url);
      setLearners(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load learners');
    } finally {
      setLoading(false);
    }
  };

  // Load teachers for the assignment dropdown (principal/admin only)
  const fetchTeachers = async () => {
    if (!canEdit) return;
    try {
      const response = await api.get('/users');
      const teachersList = response.data.filter(
        (u) => u.role === 'teacher' && u.isActive
      );
      setTeachers(teachersList);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  useEffect(() => {
    fetchLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLearners();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete learner "${name}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/learners/${id}`);
      setSuccess(`Learner "${name}" deleted successfully.`);
      fetchLearners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete learner');
    }
  };

  const handleCreate = () => {
    setEditingLearner(null);
    setShowModal(true);
  };

  const handleEdit = (learner) => {
    setEditingLearner(learner);
    setShowModal(true);
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    const wasEditing = !!editingLearner;
    setEditingLearner(null);
    if (refresh) {
      fetchLearners();
      setSuccess(wasEditing ? 'Learner updated successfully.' : 'Learner created successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isTeacher ? 'My Learners' : 'Learners'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isTeacher
              ? 'Learners assigned to you'
              : 'Manage all student profiles and records'}
          </p>
        </div>
        {canCreate && (
          <button onClick={handleCreate} className="btn-primary">
            + Add Learner
          </button>
        )}
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

      {/* Search */}
      <div className="mb-4 card">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or guardian..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTimeout(fetchLearners, 0);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Learners table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : learners.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👨‍🎓</div>
          <p className="text-gray-600 mb-2">
            {isTeacher ? 'No learners assigned to you yet' : 'No learners found'}
          </p>
          {search && (
            <p className="text-sm text-gray-500">Try a different search term</p>
          )}
          {canCreate && !search && (
            <button onClick={handleCreate} className="btn-primary mt-4">
              {isTeacher ? 'Create a learner (auto-assigned to you)' : 'Add the first learner'}
            </button>
          )}
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
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incidents
                  </th>
                  {(canEdit || canCreate) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {learners.map((learner) => (
                  <tr key={learner.learnerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                          {learner.firstName?.[0]}{learner.lastName?.[0]}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {learner.firstName} {learner.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {learner.learnerId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {learner.age} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {learner.gender || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {learner.guardianName || '—'}
                      {learner.guardianPhone && (
                        <div className="text-xs text-gray-500">{learner.guardianPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {learner.assignedTeacherName ? (
                        <span className="inline-flex items-center gap-1 text-gray-900">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {learner.assignedTeacherName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          learner.healthIncidentCount > 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {learner.healthIncidentCount}
                      </span>
                    </td>
                    {(canEdit || canCreate) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(learner)}
                            className="text-primary-600 hover:text-primary-800 mr-4 font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() =>
                              handleDelete(
                                learner.learnerId,
                                `${learner.firstName} ${learner.lastName}`
                              )
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
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LearnerModal
          learner={editingLearner}
          teachers={teachers}
          canAssign={canEdit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

// ============================================================
// LearnerModal component
// ============================================================
const LearnerModal = ({ learner, teachers, canAssign, onClose }) => {
  const isEditing = !!learner;
  const [formData, setFormData] = useState({
    firstName: learner?.firstName || '',
    lastName: learner?.lastName || '',
    dateOfBirth: learner?.dateOfBirth?.slice(0, 10) || '',
    gender: learner?.gender || '',
    address: learner?.address || '',
    supportNeeds: learner?.supportNeeds || '',
    medicalConditions: learner?.medicalConditions || '',
    allergies: learner?.allergies || '',
    guardianName: learner?.guardianName || '',
    guardianPhone: learner?.guardianPhone || '',
    guardianEmail: learner?.guardianEmail || '',
    assignedTeacherId: learner?.assignedTeacherId || '',
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
      const payload = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        assignedTeacherId: formData.assignedTeacherId || null,
      };

      if (isEditing) {
        await api.put(`/learners/${learner.learnerId}`, payload);
      } else {
        await api.post('/learners', payload);
      }

      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to save learner');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Learner' : 'Add New Learner'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Personal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Personal Information
            </h3>
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
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., KwaMduku, Hluhluwe"
              />
            </div>
          </div>

          {/* Teacher Assignment — only for principal/admin */}
          {canAssign && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Teacher Assignment
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Teacher
                </label>
                <select
                  name="assignedTeacherId"
                  value={formData.assignedTeacherId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">— Unassigned —</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The assigned teacher will be the only one (besides principal/admin) who can see this learner.
                </p>
              </div>
            </div>
          )}

          {/* Support & Medical */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Support & Medical
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Support Needs
                </label>
                <textarea
                  name="supportNeeds"
                  value={formData.supportNeeds}
                  onChange={handleChange}
                  rows="2"
                  className="input-field"
                  placeholder="e.g., Requires mobility assistance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  rows="2"
                  className="input-field"
                  placeholder="e.g., Epilepsy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Peanuts, Dairy"
                />
              </div>
            </div>
          </div>

          {/* Guardian */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Guardian Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Email
                </label>
                <input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
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
              {saving ? 'Saving...' : isEditing ? 'Update Learner' : 'Create Learner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Learners;