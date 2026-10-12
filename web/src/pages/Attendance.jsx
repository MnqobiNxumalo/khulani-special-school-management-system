import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
};

const STATUS_ICONS = {
  present: '✅',
  absent: '❌',
  late: '⏰',
};

const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [learners, setLearners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const canMark = ['principal', 'admin', 'teacher'].includes(user?.role);
  const canDelete = user?.role === 'principal';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [recordsRes, learnersRes, summaryRes] = await Promise.all([
        api.get(`/attendance?date=${selectedDate}`),
        api.get('/learners'),
        api.get(`/attendance/summary?date=${selectedDate}`),
      ]);
      setRecords(recordsRes.data);
      setLearners(learnersRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleDelete = async (id, learnerName) => {
    if (!window.confirm(`Delete attendance record for ${learnerName}?`)) return;

    try {
      await api.delete(`/attendance/${id}`);
      setSuccess('Attendance record deleted.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingRecord(null);
    if (refresh) {
      fetchData();
      setSuccess(editingRecord ? 'Attendance updated.' : 'Attendance marked.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Get list of learners who haven't been marked yet for the selected date
  const markedLearnerIds = records.map((r) => r.learnerId);
  const unmarkedLearners = learners.filter(
    (l) => !markedLearnerIds.includes(l.learnerId)
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">{formatDate(selectedDate)}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
            max={new Date().toISOString().slice(0, 10)}
          />
          {canMark && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setShowModal(true);
              }}
              className="btn-primary"
              disabled={unmarkedLearners.length === 0}
            >
              + Mark Attendance
            </button>
          )}
        </div>
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

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <p className="text-xs font-medium text-gray-600 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium text-green-600 uppercase">Present</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{summary.present}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium text-red-600 uppercase">Absent</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{summary.absent}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium text-yellow-600 uppercase">Late</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{summary.late}</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium text-primary-600 uppercase">Rate</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">
              {summary.attendanceRate.toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Info banner if there are unmarked learners */}
      {canMark && unmarkedLearners.length > 0 && !loading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          ℹ️ {unmarkedLearners.length} learner{unmarkedLearners.length !== 1 ? 's' : ''} still unmarked for this day.
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-600 mb-2">No attendance marked for this day</p>
          <p className="text-sm text-gray-500">
            {canMark
              ? 'Click "Mark Attendance" to record who is present today.'
              : 'Only teachers and admins can mark attendance.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Learner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
                {(canMark || canDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.attendanceId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {record.learnerFullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[record.status] || STATUS_COLORS.present
                      }`}
                    >
                      {STATUS_ICONS[record.status]} {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    {record.notes || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.recordedByName}
                    <div className="text-xs text-gray-400">
                      {formatTime(record.createdAt)}
                    </div>
                  </td>
                  {(canMark || canDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {canMark && (
                        <button
                          onClick={() => {
                            setEditingRecord(record);
                            setShowModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-800 mr-4 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() =>
                            handleDelete(record.attendanceId, record.learnerFullName)
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
      {showModal && (
        <AttendanceModal
          record={editingRecord}
          learners={editingRecord ? learners : unmarkedLearners}
          date={selectedDate}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

// ============================================================
// AttendanceModal component
// ============================================================
const AttendanceModal = ({ record, learners, date, onClose }) => {
  const isEditing = !!record;
  const [formData, setFormData] = useState({
    learnerId: record?.learnerId || '',
    status: record?.status || 'present',
    notes: record?.notes || '',
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
      if (isEditing) {
        // Update: only status and notes
        await api.put(`/attendance/${record.attendanceId}`, {
          status: formData.status,
          notes: formData.notes,
        });
      } else {
        // Mark new: include learnerId and date
        await api.post('/attendance', {
          learnerId: formData.learnerId,
          status: formData.status,
          notes: formData.notes,
          date: new Date(date).toISOString(),
        });
      }
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to save attendance');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? `Editing ${record.learnerFullName}'s record`
              : 'Select a learner and mark their status'}
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
                  {l.firstName} {l.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['present', 'absent', 'late'].map((status) => (
                <label
                  key={status}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.status === status
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-2xl">{STATUS_ICONS[status]}</span>
                  <span className="text-xs font-medium capitalize text-gray-700">
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="e.g., Arrived late at 9:15 due to doctor's appointment"
            />
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
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Attendance;