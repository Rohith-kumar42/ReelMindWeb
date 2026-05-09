require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const devUser = require('./middleware/devUser');

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json({ limit: '1mb' }));
app.use(devUser);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/content', require('./routes/content'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/search', require('./routes/search'));
app.use('/api/pipeline', require('./routes/pipeline'));
app.use('/api/recommend', require('./routes/recommend'));
app.use('/api/tags', require('./routes/tags'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.code === 'DUPLICATE_CONTENT') {
    return res.status(409).json({
      message: 'Already saved',
      existingItem: err.existingItem,
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Unexpected server error',
    details: process.env.NODE_ENV === 'production' ? undefined : err.details,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ReelMind API running on :${port}`);
});
