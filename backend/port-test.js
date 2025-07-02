// Simple test server to verify port binding
import express from 'express';

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Port binding test successful' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server listening on port ${PORT}`);
  console.log('If you see this message, the server is successfully bound to port ${PORT}');
});
