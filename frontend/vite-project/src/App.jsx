import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { getStoredUser, restoreSession, logout } from './services/auth';

function App() {
  const [user, setUser] = useState(getStoredUser());
  useEffect(() => { restoreSession().then(setUser); }, []);
  const openDashboard = () => { if (getStoredUser()) setUser(getStoredUser()); };
  if (user) return <Dashboard onLogout={() => { logout(); setUser(null); }} />;
  return <Home onAuthenticated={openDashboard} />;
}
export default App;
