require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/hello', (req, res) => res.send('Hello from server!'));

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
