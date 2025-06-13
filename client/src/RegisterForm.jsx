import { useState } from 'react';

export default function RegisterForm({ onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      // Step 1: Register
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Step 2: Auto login
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError('Registered but failed to log in.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', loginData.token);
      onRegister(); // Notify App to continue
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Register for SnapKitty</h2>

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
        onClick={handleRegister}
        style={{ padding: '8px 16px' }}
        disabled={loading}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>

      <p style={{ marginTop: '15px' }}>
        Already have an account?{' '}
        <a href="#" onClick={onSwitchToLogin}>
          Login here
        </a>
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
