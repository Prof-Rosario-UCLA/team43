import { useState } from 'react';
import UploadHistory from './UploadHistory'; 

function App() {
  const [message, setMessage] = useState('No upload yet');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Handle image upload
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
        body: formData,
      });

      const data = await res.json();

      setMessage('✅ Uploaded: ' + data.filename);

      // Build image preview path based on environment
      const url =
        import.meta.env.MODE === 'production'
          ? `/tmp/${data.filename}`
          : `/uploads/${data.filename}`;

      setImageUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('❌ Upload failed');
    }
  };

  return (
    <div style={{ padding: '40px' }}>
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
        <UploadHistory />
      </section>
    </div>
  );
}

export default App;
