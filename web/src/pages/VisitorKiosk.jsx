import { useState, useEffect } from 'react';
import api from '../api/axios';

const VisitorKiosk = () => {
  const [mode, setMode] = useState('welcome'); // welcome | checkin | checkout | success
  const [formData, setFormData] = useState({ fullName: '', phone: '', purpose: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  // Auto-reset to welcome after 8 seconds of success
  useEffect(() => {
    if (mode === 'success') {
      const timer = setTimeout(() => {
        setMode('welcome');
        setFormData({ fullName: '', phone: '', purpose: '' });
        setSuccess(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/publicvisitor/checkin', formData);
      setSuccess({
        type: 'checkin',
        title: 'Welcome!',
        message: res.data.message,
        name: res.data.fullName,
        time: res.data.checkInTime,
      });
      setMode('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in. Please see reception.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/publicvisitor/checkout', { phone: formData.phone });
      setSuccess({
        type: 'checkout',
        title: 'Goodbye!',
        message: res.data.message,
        name: res.data.fullName,
        time: res.data.checkOutTime,
      });
      setMode('success');
    } catch (err) {
      setError(err.response?.data?.message || 'No active check-in found for this number.');
    } finally {
      setSaving(false);
    }
  };

  // -------------- WELCOME SCREEN --------------
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center text-white mb-10">
            <div className="text-7xl mb-4">🏫</div>
            <h1 className="text-4xl md:text-5xl font-bold">Khulani Special School</h1>
            <p className="text-xl mt-3 text-primary-100">Visitor Self Check-In</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('checkin')}
              className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 text-left"
            >
              <div className="text-5xl mb-4">🚪</div>
              <h2 className="text-2xl font-bold text-gray-900">I'm Arriving</h2>
              <p className="text-gray-600 mt-2">Check in when you enter the school</p>
            </button>

            <button
              onClick={() => setMode('checkout')}
              className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 text-left"
            >
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-gray-900">I'm Leaving</h2>
              <p className="text-gray-600 mt-2">Check out when you leave the school</p>
            </button>
          </div>

          <p className="text-center text-primary-100 text-sm mt-8">
            For assistance, please see the receptionist.
          </p>
        </div>
      </div>
    );
  }

  // -------------- SUCCESS SCREEN --------------
  if (mode === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center text-white">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-4xl md:text-5xl font-bold">{success.title}</h1>
          <p className="text-2xl mt-3">{success.name}</p>
          <p className="text-lg mt-4 text-green-100">{success.message}</p>
          <div className="mt-8 text-green-100">
            <p className="text-sm">
              {success.type === 'checkin' ? 'Checked in at' : 'Checked out at'}{' '}
              {new Date(success.time).toLocaleTimeString('en-ZA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <p className="mt-10 text-sm text-green-200">
            This screen will reset automatically in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // -------------- FORM SCREEN (checkin or checkout) --------------
  const isCheckIn = mode === 'checkin';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-primary-600 text-white p-6">
          <button
            onClick={() => {
              setMode('welcome');
              setError('');
              setFormData({ fullName: '', phone: '', purpose: '' });
            }}
            className="text-sm text-primary-100 hover:text-white mb-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">
            {isCheckIn ? 'Welcome!' : 'Goodbye!'}
          </h1>
          <p className="text-primary-100 mt-1">
            {isCheckIn
              ? 'Please tell us a bit about yourself'
              : 'Enter your phone number to check out'}
          </p>
        </div>

        <form
          onSubmit={isCheckIn ? handleCheckIn : handleCheckOut}
          className="p-6 space-y-5"
        >
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isCheckIn && (
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Your Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                maxLength={200}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="e.g., Dr. Sipho Mthembu"
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={20}
              className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="e.g., 082 123 4567"
              autoFocus={!isCheckIn}
            />
          </div>

          {isCheckIn && (
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                maxLength={500}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="e.g., Parent visit / Delivery / Meeting"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white text-xl font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving
              ? 'Please wait...'
              : isCheckIn
              ? '✅ Check In'
              : '👋 Check Out'}
          </button>

          <p className="text-center text-sm text-gray-500">
            All information is kept confidential and used only for security records.
          </p>
        </form>
      </div>
    </div>
  );
};

export default VisitorKiosk;