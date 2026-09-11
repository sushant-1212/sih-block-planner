require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { db } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request timing & logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url.startsWith('/api')) {
      console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API router
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'sih-block-planner-backend',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend production build if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('SIH Block Planner Backend is running. Frontend build not found.');
    }
  });
});

async function startServer() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`
==================================================================
  🚄 Gati Marg — AI Railway Block Planner & Fleet Dispatcher
==================================================================
  🌐 Unified App URL:  http://localhost:${PORT}
  📡 REST API Base:    http://localhost:${PORT}/api/network
  ⚡ Custom LRU Cache: Active (Capacity: ${process.env.CACHE_CAPACITY || 50})
==================================================================
    `);
  });
}

startServer();
