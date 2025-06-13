import { useState } from 'react';

export default function LoginForm({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      onLogin(); // Notify App of successful login
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login to SnapKitty</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ margin: '10px', padding: '8px' }}
      />
      <br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ margin: '10px', padding: '8px' }}
      />
      <br />

      <button
        onClick={handleLogin}
        style={{ padding: '8px 16px' }}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p style={{ marginTop: '15px' }}>
        Don’t have an account?{' '}
        <a href="#" onClick={onSwitchToRegister}>
          Register here
        </a>
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
