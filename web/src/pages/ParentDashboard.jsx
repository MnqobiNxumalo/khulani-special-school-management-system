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

const ParentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/parent/dashboard');
        setDashboard(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Unable to load your dashboard
        </h2>
        <p className="text-gray-600">{error}</p>
        <p className="text-sm text-gray-500 mt-4">
          If this issue continues, please contact the school administration.
        </p>
      </div>
    );
  }

  if (!dashboard?.child) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <div className="text-6xl mb-4">👨‍👩‍👧</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No child linked to your account
        </h2>
        <p className="text-gray-600">
          Please contact the school administration to link your account to your child.
        </p>
      </div>
    );
  }

  const { child, recentIncidents, recentAttendance, recentMessages, attendanceSummary } = dashboard;

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's the latest information about your child's progress at Khulani Special School.
        </p>
      </div>

      {/* Child profile card */}
      <div className="card mb-6 bg-gradient-to-br from-primary-50 to-white border-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {child.firstName?.[0]}{child.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {child.firstName} {child.lastName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Age</p>
                <p className="font-medium text-gray-900">{child.age} years</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">{child.gender || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Enrolled</p>
                <p className="font-medium text-gray-900">{formatDate(child.enrollmentDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Your Role</p>
                <p className="font-medium text-gray-900">Parent / Guardian</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical info */}
        {(child.medicalConditions || child.allergies || child.supportNeeds) && (
          <div className="mt-4 pt-4 border-t border-primary-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {child.medicalConditions && (
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  🏥 Medical Conditions
                </p>
                <p className="font-medium text-gray-900 mt-1">{child.medicalConditions}</p>
              </div>
            )}
            {child.allergies && (
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  ⚠️ Allergies
                </p>
                <p className="font-medium text-gray-900 mt-1">{child.allergies}</p>
              </div>
            )}
            {child.supportNeeds && (
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  💙 Support Needs
                </p>
                <p className="font-medium text-gray-900 mt-1">{child.supportNeeds}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 uppercase">Health Incidents</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{dashboard.totalIncidents}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 uppercase">Attendance Rate</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">
            {attendanceSummary?.attendanceRate.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 uppercase">Days Present</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {attendanceSummary?.present ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {attendanceSummary?.absent ?? 0} absent, {attendanceSummary?.late ?? 0} late
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 uppercase">Messages</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {dashboard.unreadMessages}
          </p>
          <p className="text-xs text-gray-400 mt-1">Unread from school</p>
        </div>
      </div>

      {/* Two columns: Incidents + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Health Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              🏥 Recent Health Events
            </h2>
            <span className="text-xs text-gray-500">
              {recentIncidents.length} shown
            </span>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-sm text-gray-500">
                No health incidents recorded. Great news!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.incidentId}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        INCIDENT_COLORS[incident.incidentType] || INCIDENT_COLORS.Other
                      }`}
                    >
                      {incident.incidentType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(incident.incidentDate)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{incident.description}</p>
                  {incident.actionTaken && (
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Action:</strong> {incident.actionTaken}
                    </p>
                  )}
                  {incident.outcome && (
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Outcome:</strong> {incident.outcome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ✅ Recent Attendance
            </h2>
            <span className="text-xs text-gray-500">
              Last 14 records
            </span>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm text-gray-500">
                No attendance records yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentAttendance.map((record) => (
                <div
                  key={record.attendanceId}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[record.status]
                      }`}
                    >
                      {STATUS_ICONS[record.status]} {record.status}
                    </span>
                    <span className="text-sm text-gray-700">
                      {formatDate(record.date)}
                    </span>
                  </div>
                  {record.notes && (
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                      {record.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            💬 Recent Messages
          </h2>
          <span className="text-xs text-gray-500">
            Communication with school
          </span>
        </div>

        {recentMessages.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📬</div>
            <p className="text-sm text-gray-500">
              No messages yet. Staff will contact you here when needed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMessages.map((msg) => {
              const isFromSchool = msg.senderId !== user?.userId;
              return (
                <div
                  key={msg.messageId}
                  className={`p-3 rounded-lg border ${
                    isFromSchool && !msg.isRead
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {isFromSchool ? `From: ${msg.senderName}` : `To: ${msg.receiverName}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(msg.sentAt)}
                    </span>
                  </div>
                  {msg.learnerFullName && (
                    <p className="text-xs text-primary-600 mb-1">
                      👤 Re: {msg.learnerFullName}
                    </p>
                  )}
                  <p className="text-sm text-gray-800">{msg.messageText}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;