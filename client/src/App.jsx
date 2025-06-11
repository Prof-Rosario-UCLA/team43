import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('No upload yet');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(''); // 

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
      setImageUrl('/uploads/' + data.filename); 
    } catch (err) {
      setMessage('Upload failed');
    }
  };

  return (
    <div>
      <h1>SnapKitty Upload</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>
      <p><strong>{message}</strong></p>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Uploaded"
          style={{ maxWidth: '300px', marginTop: '20px' }}
        />
      )}
    </div>
  );
}

export default App;
