import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const canDelete = user?.role === 'principal';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [inboxRes, sentRes, unreadRes, learnersRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent'),
        api.get('/messages/unread-count'),
        api.get('/learners'),
      ]);
      setInbox(inboxRes.data);
      setSent(sentRes.data);
      setUnreadCount(unreadRes.data.count);
      setLearners(learnersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenMessage = async (message) => {
    setSelectedMessage(message);
    if (activeTab === 'inbox' && !message.isRead) {
      try {
        await api.put(`/messages/${message.messageId}/read`);
        setInbox((prev) =>
          prev.map((m) =>
            m.messageId === message.messageId ? { ...m, isRead: true } : m
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setSelectedMessage({ ...message, isRead: true });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleDelete = async (id, text) => {
    const preview = text.length > 40 ? text.slice(0, 40) + '...' : text;
    if (!window.confirm(`Delete message: "${preview}"?`)) return;

    try {
      await api.delete(`/messages/${id}`);
      setSuccess('Message deleted.');
      setSelectedMessage(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleComposeClose = (refresh) => {
    setShowModal(false);
    if (refresh) {
      fetchData();
      setSuccess('Message sent successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const currentMessages = activeTab === 'inbox' ? inbox : sent;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Internal staff communication
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          ✉️ Compose
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 mb-4 p-1 flex">
            <button
              onClick={() => {
                setActiveTab('inbox');
                setSelectedMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📥 Inbox ({inbox.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('sent');
                setSelectedMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📤 Sent ({sent.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">
                {activeTab === 'inbox' ? '📥' : '📤'}
              </div>
              <p className="text-gray-600">
                {activeTab === 'inbox'
                  ? 'No messages in your inbox'
                  : 'No sent messages'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMessages.map((msg) => {
                const isSelected = selectedMessage?.messageId === msg.messageId;
                const showAsUnread = activeTab === 'inbox' && !msg.isRead;
                return (
                  <button
                    key={msg.messageId}
                    onClick={() => handleOpenMessage(msg)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {showAsUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0"></span>
                        )}
                        <p
                          className={`truncate text-sm ${
                            showAsUnread
                              ? 'font-bold text-gray-900'
                              : 'font-medium text-gray-700'
                          }`}
                        >
                          {activeTab === 'inbox' ? msg.senderName : msg.receiverName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDateTime(msg.sentAt)}
                      </span>
                    </div>
                    {msg.learnerFullName && (
                      <p className="text-xs text-primary-600 mb-1 truncate">
                        👤 {msg.learnerFullName}
                      </p>
                    )}
                    <p
                      className={`text-sm truncate ${
                        showAsUnread ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {msg.messageText}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="card sticky top-6">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {activeTab === 'inbox'
                      ? `From: ${selectedMessage.senderName}`
                      : `To: ${selectedMessage.receiverName}`}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedMessage.sentAt).toLocaleString('en-ZA', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(activeTab === 'sent' || canDelete) && (
                    <button
                      onClick={() =>
                        handleDelete(
                          selectedMessage.messageId,
                          selectedMessage.messageText
                        )
                      }
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {selectedMessage.learnerFullName && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs font-medium text-primary-700 uppercase">
                    Regarding Learner
                  </p>
                  <p className="text-sm font-semibold text-primary-900 mt-1">
                    👤 {selectedMessage.learnerFullName}
                  </p>
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.messageText}
                </p>
              </div>
            </div>
          ) : (
            <div className="card text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 mb-1">Select a message to read</p>
              <p className="text-sm text-gray-500">
                Click any message on the left to view its full contents
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ComposeModal
          learners={learners}
          currentUserId={user.userId}
          onClose={handleComposeClose}
        />
      )}
    </div>
  );
};

// ============================================================
// ComposeModal — uses /users/directory for recipient list
// ============================================================
const ComposeModal = ({ learners, currentUserId, onClose }) => {
  const [formData, setFormData] = useState({
    receiverId: '',
    learnerId: '',
    messageText: '',
  });
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const response = await api.get('/users/directory');
        // Exclude current user from recipient list
        const others = response.data.filter((u) => u.userId !== currentUserId);
        setRecipients(others);
      } catch (err) {
        console.error('Failed to load recipients:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchRecipients();
  }, [currentUserId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post('/messages', {
        receiverId: formData.receiverId,
        messageText: formData.messageText,
        learnerId: formData.learnerId || null,
      });
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to send message');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const roleIcons = {
    principal: '👑',
    admin: '⚙️',
    teacher: '👨‍🏫',
    parent: '👨‍👩‍👧',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Compose Message</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send a message to another user
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To *
            </label>
            {loadingUsers ? (
              <div className="text-sm text-gray-500 py-2">Loading recipients...</div>
            ) : recipients.length === 0 ? (
              <div className="text-sm text-amber-600 py-2 bg-amber-50 p-3 rounded-lg">
                ⚠️ No other users found.
              </div>
            ) : (
              <select
                name="receiverId"
                value={formData.receiverId}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select recipient...</option>
                {recipients.map((r) => (
                  <option key={r.userId} value={r.userId}>
                    {roleIcons[r.role] || '👤'} {r.fullName} — {r.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About a Learner (optional)
            </label>
            <select
              name="learnerId"
              value={formData.learnerId}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">No specific learner</option>
              {learners.map((l) => (
                <option key={l.learnerId} value={l.learnerId}>
                  {l.firstName} {l.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              name="messageText"
              value={formData.messageText}
              onChange={handleChange}
              required
              rows="5"
              maxLength={2000}
              className="input-field"
              placeholder="Type your message..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.messageText.length} / 2000 characters
            </p>
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
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || recipients.length === 0}
            >
              {saving ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Messages;