import { useEffect, useState } from 'react';

function UploadHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [solvingMap, setSolvingMap] = useState({});

  const token = localStorage.getItem('token');

  // Load upload records on mount
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/records', {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        });
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [token]);

  // Clear all records
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all records?')) return;

    setClearing(true);
    try {
      const res = await fetch('/api/clear-records', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const text = await res.text();
      alert(text);
      setRecords([]);
    } catch (err) {
      console.error('Failed to clear records:', err);
      alert('Failed to clear records');
    } finally {
      setClearing(false);
    }
  };

  // Delete single record
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const data = await res.json();
      alert(data.message);
      setRecords((prev) => prev.filter((rec) => rec._id !== id));
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('Failed to delete record');
    }
  };

  // Solve record (GPT-based)
  const handleSolve = async (id) => {
    setSolvingMap((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch(`/api/solve/${id}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const data = await res.json();

      setRecords((prev) =>
        prev.map((rec) =>
          rec._id === id ? { ...rec, solution: data.solution } : rec
        )
      );
    } catch (err) {
      console.error('Failed to solve question:', err);
      alert('Solve failed');
    } finally {
      setSolvingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📜 Upload History</h2>

      {/* Clear All button */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button
          onClick={handleClearAll}
          disabled={clearing}
          style={{
            padding: '6px 12px',
            border: '1px solid #888',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          🧹 Clear All Records
        </button>
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {records.map((rec) => {
            const url =
              import.meta.env.MODE === 'production'
                ? `/tmp/${rec.filename}`
                : `/uploads/${rec.filename}`;

            return (
              <div
                key={rec._id}
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  borderRadius: '6px',
                  position: 'relative',
                }}
              >
                <img
                  src={url}
                  alt="Uploaded"
                  style={{ maxWidth: '200px', borderRadius: '4px' }}
                />
                <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                  Uploaded at: {new Date(rec.uploadTime).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#444' }}>
                  <strong>📖 Text:</strong> {rec.extractedText || 'Not available'}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#444' }}>
                  <strong>📌 Keywords:</strong> {rec.keywords || 'Not available'}
                </p>

                {/* 💡 Solve Button */}
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => handleSolve(rec._id)}
                    disabled={solvingMap[rec._id]}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.85rem',
                      borderRadius: '4px',
                      border: '1px solid #aaa',
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    💡 {solvingMap[rec._id] ? 'Solving...' : 'Solve'}
                  </button>
                </div>

                {/* 🧠 GPT Solution */}
                {rec.solution && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.85rem',
                    }}
                  >
                    <strong>🧠 Solution:</strong> <br />
                    {rec.solution}
                  </div>
                )}

                {/* 🗑 Delete Button */}
                <button
                  onClick={() => handleDelete(rec._id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                  title="Delete this record"
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UploadHistory;
