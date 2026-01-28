import express from 'express';
import { router as incidentRouter } from './handlers/incidentHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', incidentRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`CyberAttacksNews incident tracker running on port ${PORT}`);
});

export default app;
