import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const INCIDENT_TYPES = [
  'Seizure', 'Fall', 'Illness', 'Injury', 'Allergic Reaction',
  'Behavioral', 'Medication', 'Respiratory', 'Other',
];

const INCIDENT_COLORS = {
  'Seizure': 'bg-red-100 text-red-700',
  'Fall': 'bg-orange-100 text-orange-700',
  'Illness': 'bg-yellow-100 text-yellow-700',
  'Injury': 'bg-pink-100 text-pink-700',
  'Allergic Reaction': 'bg-purple-100 text-purple-700',
  'Behavioral': 'bg-blue-100 text-blue-700',
  'Medication': 'bg-indigo-100 text-indigo-700',
  'Respiratory': 'bg-cyan-100 text-cyan-700',
  'Other': 'bg-gray-100 text-gray-700',
};

const HealthIncidents = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

  const canCreate = ['principal', 'admin', 'teacher'].includes(user?.role);
  const canDelete = user?.role === 'principal';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [incidentsRes, learnersRes] = await Promise.all([
        api.get(filter !== 'all' ? `/healthincidents?recentDays=${filter}` : '/healthincidents'),
        api.get('/learners'),
      ]);
      setIncidents(incidentsRes.data);
      setLearners(learnersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDelete = async (id, type, learnerName) => {
    if (!window.confirm(`Delete "${type}" incident for ${learnerName}?`)) return;

    try {
      await api.delete(`/healthincidents/${id}`);
      setSuccess('Incident deleted successfully.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete incident');
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingIncident(null);
    if (refresh) {
      fetchData();
      setSuccess(editingIncident ? 'Incident updated.' : 'Incident logged successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: '1', label: 'Last 24 Hours' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Incidents</h1>
          <p className="text-gray-600 mt-1">
            Log and review all health and safety events
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingIncident(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            + Log Incident
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

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏥</div>
          <p className="text-gray-600 mb-2">No incidents recorded</p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'When a learner has a health event, log it here for the safety record.'
              : 'No incidents in this time range.'}
          </p>
          {canCreate && filter === 'all' && (
            <button
              onClick={() => {
                setEditingIncident(null);
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              Log the first incident
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div key={incident.incidentId} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🚨
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          INCIDENT_COLORS[incident.incidentType] || INCIDENT_COLORS.Other
                        }`}
                      >
                        {incident.incidentType}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {incident.learnerFullName}
                      </span>
                      {incident.notifyGuardian && (
                        <span className="text-xs text-blue-600 font-medium">
                          📧 Guardian Notified
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      {incident.description}
                    </p>

                    {incident.actionTaken && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Action:</span>{' '}
                        {incident.actionTaken}
                      </p>
                    )}

                    {incident.outcome && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Outcome:</span>{' '}
                        {incident.outcome}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 {formatDateTime(incident.incidentDate)}</span>
                      <span>👤 {incident.reportedByName}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canDelete && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleDelete(
                          incident.incidentId,
                          incident.incidentType,
                          incident.learnerFullName
                        )
                      }
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <IncidentModal
          incident={editingIncident}
          learners={learners}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

// ============================================================
// IncidentModal component
// ============================================================
const IncidentModal = ({ incident, learners, onClose }) => {
  const isEditing = !!incident;
  const [formData, setFormData] = useState({
    learnerId: incident?.learnerId || '',
    incidentType: incident?.incidentType || 'Seizure',
    description: incident?.description || '',
    actionTaken: incident?.actionTaken || '',
    outcome: incident?.outcome || '',
    notifyGuardian: incident?.notifyGuardian || false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEditing) {
        // Update doesn't include learnerId (immutable)
        await api.put(`/healthincidents/${incident.incidentId}`, {
          incidentType: formData.incidentType,
          description: formData.description,
          actionTaken: formData.actionTaken,
          outcome: formData.outcome,
          notifyGuardian: formData.notifyGuardian,
        });
      } else {
        await api.post('/healthincidents', formData);
      }
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to save incident');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Incident' : 'Log New Health Incident'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? 'Update the incident details below.'
              : 'Record what happened, what you did, and the outcome.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Learner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learner *
            </label>
            <select
              name="learnerId"
              value={formData.learnerId}
              onChange={handleChange}
              required
              disabled={isEditing}
              className="input-field disabled:bg-gray-100"
            >
              <option value="">Select a learner...</option>
              {learners.map((l) => (
                <option key={l.learnerId} value={l.learnerId}>
                  {l.firstName} {l.lastName} ({l.age} years)
                </option>
              ))}
            </select>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Learner cannot be changed for an existing incident.
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident Type *
            </label>
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
              className="input-field"
            >
              {INCIDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description * (minimum 10 characters)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              minLength={10}
              className="input-field"
              placeholder="Describe what happened — be specific about time, symptoms, and duration..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length} characters
            </p>
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Taken
            </label>
            <textarea
              name="actionTaken"
              value={formData.actionTaken}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="e.g., Kept learner safe, called school nurse, timed the seizure..."
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outcome
            </label>
            <textarea
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="e.g., Learner recovered and resumed class, monitored for the rest of the day..."
            />
          </div>

          {/* Notify Guardian */}
          <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              name="notifyGuardian"
              checked={formData.notifyGuardian}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">
                Notify Guardian
              </p>
              <p className="text-xs text-gray-600">
                Flag this incident for parent/guardian notification
              </p>
            </div>
          </label>

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
              {saving ? 'Saving...' : isEditing ? 'Update Incident' : 'Log Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthIncidents;