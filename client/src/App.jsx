import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.text())
      .then(setMessage)
      .catch(() => setMessage('Failed to fetch from server'))
  }, [])

  return (
    <div>
      <h1>SnapKitty Client</h1>
      <p>Server says: <strong>{message}</strong></p>
    </div>
  )
}

export default App

