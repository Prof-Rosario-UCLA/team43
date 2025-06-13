import { useState, useEffect } from 'react';
import UploadHistory from './UploadHistory';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('No upload yet');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          setLoggedIn(true);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Auth check failed');
      }
    };
    checkLogin();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
        body: formData,
      });

      const data = await res.json();
      setMessage('✅ Uploaded: ' + data.filename);

      const url =
        import.meta.env.MODE === 'production'
          ? `/tmp/${data.filename}`
          : `/uploads/${data.filename}`;
      setImageUrl(url);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('❌ Upload failed');
    }
  };

  // 👇 未登录状态：显示 LoginForm 或 RegisterForm
  if (!loggedIn) {
    return showRegister ? (
      <RegisterForm
        onRegister={() => setLoggedIn(true)}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm
        onLogin={() => setLoggedIn(true)}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // ✅ 登录后界面
  return (
    <div style={{ padding: '40px' }}>
      {/* ✅ 登出按钮 */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            setLoggedIn(false);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #888',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Upload Section */}
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1>SnapKitty Upload</h1>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          style={{
            marginLeft: '10px',
            padding: '8px 16px',
            borderRadius: '5px',
            border: '1px solid #333',
            cursor: 'pointer',
          }}
        >
          Upload
        </button>

        <p style={{ fontWeight: 'bold', marginTop: '20px' }}>{message}</p>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{
              maxWidth: '300px',
              marginTop: '20px',
              borderRadius: '8px',
              border: '1px solid #ccc',
            }}
          />
        )}
      </section>

      {/* History Section */}
      <section style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center' }}>📜 Upload History</h2>
        <UploadHistory key={refreshKey} />
      </section>
    </div>
  );
}

export default App;
