import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Learners from './pages/Learners';
import HealthIncidents from './pages/HealthIncidents';
import Attendance from './pages/Attendance';
import Messages from './pages/Messages';
import Visitors from './pages/Visitors';
import Staff from './pages/Staff';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes wrapped in Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="learners" element={<Learners />} />
        <Route path="health-incidents" element={<HealthIncidents />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="messages" element={<Messages />} />
        <Route path="visitors" element={<Visitors />} />
        <Route
          path="staff"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <Staff />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;