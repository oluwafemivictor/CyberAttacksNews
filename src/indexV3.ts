/**
 * CyberAttacksNews Incident Tracking System - Production Version
 * Features: Database abstraction, JWT authentication, WebSocket support
 * 
 * Demo Users for Testing:
 * - admin / admin123 (full access)
 * - analyst / analyst123 (read/write)
 * - viewer / viewer123 (read-only)
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { IDatabase } from './database/IDatabase';
import { InMemoryDatabase } from './database/InMemoryDatabase';
import { PostgresDatabase } from './database/PostgresDatabase';
import { IncidentService } from './services/IncidentService';
import { AlertService } from './services/AlertService';
import { 
  authMiddleware, 
  requireRole, 
  generateToken, 
  authenticateUser,
  getDemoUsers 
} from './middleware/Auth';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Determine which database to use
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

let db: IDatabase;

// Initialize database based on environment
async function initializeDatabase() {
  if (DATABASE_URL) {
    console.log('🔗 Initializing PostgreSQL database...');
    db = new PostgresDatabase(DATABASE_URL);
  } else {
    console.log('🔗 Using in-memory database (development)');
    db = new InMemoryDatabase();
  }

  try {
    await db.connect();
    if ('initialize' in db) {
      await (db as any).initialize();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Initialize services
const incidentService = new IncidentService(db);
const alertService = new AlertService();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Authentication endpoint - Login
 * POST /auth/login
 * Body: { username, password }
 */
app.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    expiresIn: '24h'
  });
});

/**
 * Get demo users (for testing purposes)
 * GET /auth/demo-users
 */
app.get('/auth/demo-users', (req: Request, res: Response) => {
  res.json({
    message: 'Demo users for testing (use these credentials to login)',
    users: getDemoUsers()
  });
});

/**
 * Serve demo HTML page
 */
app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CyberAttacksNews - Incident Tracking</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        h1, h2 { color: #60a5fa; margin-bottom: 1rem; }
        .status { background: #1e293b; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #10b981; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .feature { background: #1e293b; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .endpoints { background: #1e293b; padding: 1.5rem; border-radius: 8px; overflow-x: auto; }
        code { background: #0f172a; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9em; }
        pre { background: #0f172a; padding: 1rem; border-radius: 4px; overflow-x: auto; margin-top: 0.5rem; }
        .endpoint { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
        .endpoint:last-child { border-bottom: none; }
        button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2563eb; }
        .demo-section { background: #1e293b; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🛡️ CyberAttacksNews - Incident Tracking System</h1>
        
        <div class="status">
          <h2>✅ System Status: Active</h2>
          <p><strong>Database:</strong> ${DATABASE_URL ? 'PostgreSQL (Production)' : 'In-Memory (Development)'}</p>
          <p><strong>Environment:</strong> ${NODE_ENV}</p>
          <p><strong>API:</strong> Ready for requests</p>
          <p><strong>Authentication:</strong> JWT tokens required for protected endpoints</p>
        </div>

        <h2>📋 Features</h2>
        <div class="features">
          <div class="feature">
            <h3>📊 Dashboard</h3>
            <p>Real-time incident tracking and monitoring</p>
          </div>
          <div class="feature">
            <h3>🔐 Authentication</h3>
            <p>JWT-based authentication with role-based access</p>
          </div>
          <div class="feature">
            <h3>🗄️ Database</h3>
            <p>PostgreSQL for production, in-memory for dev</p>
          </div>
          <div class="feature">
            <h3>📡 Real-time Updates</h3>
            <p>WebSocket support for live notifications</p>
          </div>
        </div>

        <h2>🔑 Quick Start</h2>
        <div class="demo-section">
          <h3>1. Get Authentication Token</h3>
          <p>Send a POST request to <code>/auth/login</code>:</p>
          <pre>curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "admin123"}'</pre>
          
          <h3 style="margin-top: 1rem;">2. Use the Token</h3>
          <p>Include the token in all API requests:</p>
          <pre>curl http://localhost:3000/api/incidents \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"</pre>

          <h3 style="margin-top: 1rem;">3. Demo Users</h3>
          <p>Visit <code>/auth/demo-users</code> to see all available test accounts</p>
        </div>

        <h2>📡 API Endpoints</h2>
        <div class="endpoints">
          <div class="endpoint">
            <code>POST /auth/login</code>
            <p>Authenticate and get JWT token</p>
          </div>
          <div class="endpoint">
            <code>GET /auth/demo-users</code>
            <p>Get list of demo users for testing</p>
          </div>
          <div class="endpoint">
            <code>GET /api/incidents</code>
            <p>List all incidents (requires authentication)</p>
          </div>
          <div class="endpoint">
            <code>POST /api/incidents</code>
            <p>Create new incident (requires analyst+ role)</p>
          </div>
          <div class="endpoint">
            <code>GET /api/incidents/:id</code>
            <p>Get incident details</p>
          </div>
          <div class="endpoint">
            <code>PATCH /api/incidents/:id/status</code>
            <p>Update incident status (requires admin role)</p>
          </div>
          <div class="endpoint">
            <code>GET /api/incidents/:id/timeline</code>
            <p>Get incident timeline</p>
          </div>
          <div class="endpoint">
            <code>POST /api/incidents/:id/timeline</code>
            <p>Add timeline event (requires analyst+ role)</p>
          </div>
        </div>

        <div class="demo-section" style="margin-top: 2rem;">
          <h3>📚 Documentation</h3>
          <p>For complete API documentation, visit the <a href="https://github.com/oluwafemivictor/CyberAttacksNews" style="color: #3b82f6;">GitHub repository</a></p>
          <p>Environment: <strong>${NODE_ENV}</strong> | Database: <strong>${DATABASE_URL ? 'PostgreSQL' : 'In-Memory'}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// Apply auth middleware to all /api routes
app.use('/api', authMiddleware);

/**
 * GET /api/incidents
 * Get all incidents with optional filtering
 */
app.get('/api/incidents', async (req: Request, res: Response) => {
  try {
    const { status, severity } = req.query;
    const incidents = await incidentService.getIncidents({
      status: status as string,
      severity: severity as string
    });
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/incidents
 * Create new incident (requires analyst or admin role)
 */
app.post('/api/incidents', requireRole(['analyst', 'admin']), async (req: Request, res: Response) => {
  try {
    const { title, description, severity, discovery_date } = req.body;
    const incident = await incidentService.createIncident({
      title,
      description,
      severity,
      discovery_date: discovery_date || new Date().toISOString()
    });
    io.emit('incident:created', incident);
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/incidents/:id
 * Get incident by ID
 */
app.get('/api/incidents/:id', async (req: Request, res: Response) => {
  try {
    const incident = await db.incidents.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/incidents/:id/status
 * Update incident status (requires admin role)
 */
app.patch('/api/incidents/:id/status', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await db.incidents.update(req.params.id, { status, last_updated: new Date() });
    await db.timelines.create({
      id: uuidv4(),
      incident_id: req.params.id,
      event_type: 'status_changed',
      timestamp: new Date(),
      details: `Status changed to ${status}`
    });
    io.emit('incident:updated', updated);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/incidents/:id/timeline
 * Get incident timeline
 */
app.get('/api/incidents/:id/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await db.timelines.findByIncidentId(req.params.id);
    res.json(timeline);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/incidents/:id/timeline
 * Add timeline event (requires analyst or admin role)
 */
app.post('/api/incidents/:id/timeline', requireRole(['analyst', 'admin']), async (req: Request, res: Response) => {
  try {
    const { event_type, details } = req.body;
    const event = await db.timelines.create({
      id: uuidv4(),
      incident_id: req.params.id,
      event_type,
      timestamp: new Date(),
      details
    });
    io.emit('timeline:event', event);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/incidents/:id
 * Delete incident (requires admin role)
 */
app.delete('/api/incidents/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await db.incidents.delete(req.params.id);
    io.emit('incident:deleted', { id: req.params.id });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WEBSOCKET SUPPORT
// ============================================================================

io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });

  socket.on('subscribe:incidents', () => {
    socket.join('incidents');
    console.log(`📡 User subscribed to incidents`);
  });

  socket.on('unsubscribe:incidents', () => {
    socket.leave('incidents');
    console.log(`📡 User unsubscribed from incidents`);
  });
});

// ============================================================================
// ERROR HANDLING & STARTUP
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🛡️  CyberAttacksNews Incident Tracking System              ║
╠═══════════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                              
║  Database: ${DATABASE_URL ? 'PostgreSQL (Production)' : 'In-Memory (Development)'}
║  Environment: ${NODE_ENV}
║  WebSocket: Enabled for real-time updates
║  Authentication: JWT tokens required for API
╚═══════════════════════════════════════════════════════════════╝

📊 Quick Start:
  1. Get token: POST /auth/login with demo credentials
  2. Demo users: GET /auth/demo-users
  3. View docs: GET /
  4. API ready: Use /api/incidents with token in Authorization header

🔗 Connect: http://localhost:${PORT}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app, server, io, db };
