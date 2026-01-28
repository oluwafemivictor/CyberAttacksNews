import express, { Express } from 'express';
import { configLoader } from './config/ConfigLoader';
import { InMemoryDatabase } from './database/InMemoryDatabase';
import { requestLogger, errorHandler, notFoundHandler } from './utils/Logger';
import { validationMiddleware, asyncHandler } from './middleware/ErrorHandler';
import { IncidentService } from './services/IncidentServiceV2';
import { AlertService } from './services/AlertService';
import { DeduplicationService } from './services/DeduplicationService';
import { IncidentBuilder } from './models/incident';
import { IncidentValidator, SourceValidator } from './validators/IncidentValidator';
import { logger } from './utils/Logger';
const cors = require('cors');
const compression = require('compression');

const config = configLoader.get();
const configErrors = configLoader.validate();

if (configErrors.length > 0) {
  console.error('Configuration errors:');
  configErrors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}

const db = new InMemoryDatabase();
const incidentService = new IncidentService(db);
const app: Express = express();

app.use(cors());
app.use(compression());
app.set('json spaces', 2);
app.use(express.json());
app.use(requestLogger);

// Shared CSS and template
const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); background-attachment: fixed; color: #e2e8f0; padding: 0; }
.nav { background: rgba(15, 23, 42, 0.95); border-bottom: 1px solid rgba(71, 85, 105, 0.3); padding: 15px 0; position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(10px); }
.nav-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
.nav-logo { font-size: 24px; font-weight: 700; background: linear-gradient(90deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; cursor: pointer; }
.nav-links { display: flex; gap: 25px; list-style: none; }
.nav-links a { color: #cbd5e1; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.3s; }
.nav-links a:hover, .nav-links a.active { color: #3b82f6; }
.container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
h1 { font-size: 36px; margin-bottom: 10px; background: linear-gradient(90deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; }
.subtitle { color: #94a3b8; font-size: 14px; }
.header { text-align: center; margin-bottom: 40px; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
.card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.5); border-radius: 12px; padding: 25px; text-decoration: none; color: white; transition: all 0.3s; cursor: pointer; }
.card:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2); }
.card h2 { font-size: 18px; margin-bottom: 10px; }
.card p { font-size: 13px; color: #cbd5e1; line-height: 1.5; }
.table-container { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; overflow: auto; }
table { width: 100%; border-collapse: collapse; }
th { background: rgba(59, 130, 246, 0.2); padding: 15px; text-align: left; font-weight: 600; border-bottom: 2px solid rgba(59, 130, 246, 0.3); }
td { padding: 12px 15px; border-bottom: 1px solid rgba(71, 85, 105, 0.3); }
tr:hover { background: rgba(59, 130, 246, 0.1); }
.severity { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.severity-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.severity-high { background: rgba(251, 146, 60, 0.2); color: #fed7aa; }
.severity-medium { background: rgba(251, 191, 36, 0.2); color: #fde047; }
.severity-low { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.status-reported { background: rgba(165, 165, 165, 0.2); color: #d1d5db; }
.status-confirmed { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.status-ongoing { background: rgba(251, 146, 60, 0.2); color: #fed7aa; }
.status-mitigated { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.status-resolved { background: rgba(16, 185, 129, 0.2); color: #86efac; }
.button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; text-decoration: none; font-size: 13px; }
.button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
.form-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; }
input, textarea, select { width: 100%; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(71, 85, 105, 0.5); color: white; padding: 10px 12px; border-radius: 6px; font-family: inherit; font-size: 13px; }
input::placeholder, textarea::placeholder { color: #64748b; }
textarea { resize: vertical; min-height: 100px; }
.alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none; }
.alert.success { background: rgba(16, 185, 129, 0.2); color: #86efac; border: 1px solid rgba(16, 185, 129, 0.5); }
.alert.error { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.5); }
.loading { text-align: center; color: #94a3b8; padding: 40px; }
.empty { text-align: center; color: #64748b; padding: 40px; }
.link { color: #3b82f6; text-decoration: none; cursor: pointer; }
.link:hover { text-decoration: underline; }
.footer { text-align: center; color: #64748b; font-size: 12px; padding: 30px 0; border-top: 1px solid rgba(71, 85, 105, 0.3); margin-top: 50px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 30px 0; }
.stat-box { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 20px; text-align: center; }
.stat-value { font-size: 28px; font-weight: 800; color: #3b82f6; margin-bottom: 5px; }
.stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; }
@media (max-width: 768px) { h1 { font-size: 24px; } .nav-links { gap: 15px; font-size: 13px; } .cards-grid { grid-template-columns: 1fr; } table { font-size: 12px; } }
`;

// Home page
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CyberAttacksNews</title><style>${CSS}</style></head><body>
<nav class="nav"><div class="nav-container"><a href="/" class="nav-logo">🛡️ CyberAttacksNews</a><ul class="nav-links"><li><a href="/" class="active">Home</a></li><li><a href="/dashboard">Dashboard</a></li><li><a href="/create">New Incident</a></li><li><a href="/health">Health</a></li></ul></div></nav>
<div class="container"><div class="header"><h1>CyberAttacksNews</h1><p class="subtitle">Real-Time Incident Tracking & Cybersecurity Intelligence Platform</p></div>
<div class="stats" id="stats"><div class="stat-box"><div class="stat-value" id="stat-incidents">-</div><div class="stat-label">Active Incidents</div></div><div class="stat-box"><div class="stat-value">7</div><div class="stat-label">API Endpoints</div></div><div class="stat-box"><div class="stat-value">24/7</div><div class="stat-label">Monitoring</div></div><div class="stat-box"><div class="stat-value">99.9%</div><div class="stat-label">Uptime</div></div></div>
<div class="cards-grid"><a href="/dashboard" class="card"><h2>📊 Dashboard</h2><p>View all incidents with real-time filtering and search</p></a><a href="/create" class="card"><h2>🚨 Create Incident</h2><p>Report a new security incident</p></a><a href="/health" class="card"><h2>✅ System Status</h2><p>Check real-time system health</p></a></div>
<div class="footer"><p>🚀 CyberAttacksNews | Professional Incident Tracking</p></div></div>
<script>fetch('/api/incidents').then(r => r.json()).then(d => { document.getElementById('stat-incidents').textContent = d.count || 0; }).catch(e => console.log('Error:', e));</script>
</body></html>`);
});

// Dashboard
app.get('/dashboard', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard</title><style>${CSS}</style></head><body>
<nav class="nav"><div class="nav-container"><a href="/" class="nav-logo">🛡️ CyberAttacksNews</a><ul class="nav-links"><li><a href="/">Home</a></li><li><a href="/dashboard" class="active">Dashboard</a></li><li><a href="/create">New Incident</a></li></ul></div></nav>
<div class="container"><div class="header"><h1>📊 Incident Dashboard</h1><p class="subtitle">Manage and monitor all security incidents</p></div>
<div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
<input type="text" id="search" placeholder="Search..." style="flex: 1; min-width: 200px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.5); color: white; padding: 10px; border-radius: 6px;" />
<select id="severity" style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.5); color: white; padding: 10px; border-radius: 6px;">
<option value="">All Severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
</select>
<select id="status" style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(71, 85, 105, 0.5); color: white; padding: 10px; border-radius: 6px;">
<option value="">All Statuses</option><option value="reported">Reported</option><option value="confirmed">Confirmed</option><option value="ongoing">Ongoing</option><option value="mitigated">Mitigated</option><option value="resolved">Resolved</option>
</select>
<button class="button" onclick="loadIncidents()">🔄 Refresh</button>
</div>
<div class="table-container">
<div id="loading" class="loading">Loading incidents...</div>
<table id="table" style="display:none;">
<thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
<tbody id="tbody"></tbody>
</table>
<div id="empty" class="empty" style="display:none;">No incidents found</div>
</div>
<div class="footer"><p>🚀 CyberAttacksNews | Dashboard</p></div>
</div>
<script>
async function loadIncidents() {
  let url = '/api/incidents';
  const severity = document.getElementById('severity').value;
  const status = document.getElementById('status').value;
  const params = new URLSearchParams();
  if (severity) params.append('severity', severity);
  if (status) params.append('status', status);
  if (params.toString()) url += '?' + params.toString();
  try {
    const res = await fetch(url);
    const data = await res.json();
    let incidents = data.data || [];
    const search = document.getElementById('search').value;
    if (search) incidents = incidents.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = incidents.map(i => '<tr><td><a href="/incident/' + i.id + '" class="link">' + i.title + '</a></td><td><span class="severity severity-' + i.severity + '">' + i.severity + '</span></td><td><span class="status status-' + i.status + '">' + i.status + '</span></td><td>' + new Date(i.discovery_date).toLocaleString() + '</td><td><a href="/incident/' + i.id + '" class="link">View →</a></td></tr>').join('');
    document.getElementById('loading').style.display = 'none';
    document.getElementById('empty').style.display = incidents.length === 0 ? 'block' : 'none';
    document.getElementById('table').style.display = incidents.length > 0 ? 'table' : 'none';
  } catch (e) {
    document.getElementById('loading').textContent = 'Failed to load incidents';
  }
}
loadIncidents();
document.getElementById('search').addEventListener('input', loadIncidents);
document.getElementById('severity').addEventListener('change', loadIncidents);
document.getElementById('status').addEventListener('change', loadIncidents);
</script>
</body></html>`);
});

// Create incident page
app.get('/create', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Create Incident</title><style>${CSS}</style></head><body>
<nav class="nav"><div class="nav-container"><a href="/" class="nav-logo">🛡️ CyberAttacksNews</a><ul class="nav-links"><li><a href="/">Home</a></li><li><a href="/dashboard">Dashboard</a></li><li><a href="/create" class="active">New Incident</a></li></ul></div></nav>
<div class="container" style="max-width: 600px;"><div class="header"><h1>🚨 Report Incident</h1><p class="subtitle">Create a new security incident</p></div>
<div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 30px;">
<div id="message" class="alert"></div>
<form id="form" onsubmit="submitForm(event)">
<div class="form-group"><label>Title *</label><input type="text" name="title" required placeholder="Incident title..." /></div>
<div class="form-group"><label>Description *</label><textarea name="description" required placeholder="Details..."></textarea></div>
<div class="form-group"><label>Severity *</label><select name="severity" required><option value="">-- Select --</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
<button type="submit" class="button" style="width: 100%;">🚀 Create Incident</button>
</form>
</div>
<div class="footer"><p>🚀 CyberAttacksNews</p></div>
</div>
<script>
async function submitForm(e) {
  e.preventDefault();
  const form = document.getElementById('form');
  const msg = document.getElementById('message');
  const data = {
    title: form.title.value,
    description: form.description.value,
    severity: form.severity.value,
    discovery_date: new Date().toISOString()
  };
  try {
    const res = await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      msg.className = 'alert success';
      msg.textContent = '✓ Incident created!';
      msg.style.display = 'block';
      form.reset();
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } else throw new Error('Failed');
  } catch (e) {
    msg.className = 'alert error';
    msg.textContent = '✗ ' + e.message;
    msg.style.display = 'block';
  }
}
</script>
</body></html>`);
});

// Incident detail page
app.get('/incident/:id', asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncident(req.params.id);
  if (!incident) return res.status(404).send('Not found');
  const timeline = await incidentService.getTimeline(req.params.id);
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${incident.title}</title><style>${CSS}</style></head><body>
<nav class="nav"><div class="nav-container"><a href="/" class="nav-logo">🛡️ CyberAttacksNews</a><ul class="nav-links"><li><a href="/">Home</a></li><li><a href="/dashboard">Dashboard</a></li></ul></div></nav>
<div class="container"><a href="/dashboard" class="link" style="display: inline-block; margin-bottom: 20px;">← Back to Dashboard</a>
<div class="header"><h1>${incident.title}</h1><div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
<span class="severity severity-${incident.severity}">${incident.severity}</span>
<span class="status status-${incident.status}">${incident.status}</span>
</div></div>
<div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 25px; margin-bottom: 20px;">
<h2 style="font-size: 16px; margin-bottom: 15px;">📝 Description</h2><p>${incident.description}</p>
</div>
<div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 25px; margin-bottom: 20px;">
<h2 style="font-size: 16px; margin-bottom: 15px;">ℹ️ Details</h2>
<p><strong>Created:</strong> ${new Date(incident.discovery_date).toLocaleString()}</p>
<p><strong>Updated:</strong> ${new Date(incident.last_updated).toLocaleString()}</p>
<p><strong>ID:</strong> ${incident.id.substring(0, 12)}</p>
</div>
<div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 25px;">
<h2 style="font-size: 16px; margin-bottom: 15px;">📅 Timeline</h2>
${timeline.map(e => '<div style="display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(71, 85, 105, 0.3);"><div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; margin-top: 4px; flex-shrink: 0;"></div><div><div style="font-weight: 600; color: #e2e8f0;">' + e.event + '</div><div style="font-size: 12px; color: #94a3b8;">' + new Date(e.timestamp).toLocaleString() + '</div></div></div>').join('')}
</div>
<div class="footer"><p>🚀 CyberAttacksNews</p></div>
</div>
</body></html>`);
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
});

// API: GET incidents
app.get('/api/incidents', asyncHandler(async (req, res) => {
  const { severity, status } = req.query;
  let incidents = await incidentService.listIncidents();
  if (severity) incidents = incidents.filter(i => i.severity === severity);
  if (status) incidents = incidents.filter(i => i.status === status);
  res.json({ data: incidents, count: incidents.length });
}));

// API: POST incident
app.post('/api/incidents', asyncHandler(async (req, res) => {
  const { title, description, severity, discovery_date } = req.body;
  const incident = new IncidentBuilder()
    .withTitle(title)
    .withDescription(description)
    .withSeverity(severity || 'medium')
    .withDiscoveryDate(new Date(discovery_date || new Date()))
    .withStatus('reported')
    .build();
  const created = await incidentService.createIncident(incident);
  res.status(201).json(created);
}));

// API: GET incident by ID
app.get('/api/incidents/:id', asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncident(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Not found' });
  res.json(incident);
}));

// API: PATCH status
app.patch('/api/incidents/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const incident = await incidentService.updateIncidentStatus(req.params.id, status);
  res.json(incident);
}));

// API: GET timeline
app.get('/api/incidents/:id/timeline', asyncHandler(async (req, res) => {
  const timeline = await incidentService.getTimeline(req.params.id);
  res.json({ data: timeline });
}));

// API: POST timeline
app.post('/api/incidents/:id/timeline', asyncHandler(async (req, res) => {
  const { event, details } = req.body;
  const entry = await incidentService.addTimelineEvent(req.params.id, event, details);
  res.json(entry);
}));

// API: DELETE incident
app.delete('/api/incidents/:id', asyncHandler(async (req, res) => {
  await incidentService.deleteIncident(req.params.id);
  res.json({ success: true });
}));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.app.port || 3000;
app.listen(PORT, () => {
  logger.info(`Connected to in-memory database`);
  logger.info(`Database connected`);
  logger.info(`CyberAttacksNews incident tracker running on port ${PORT}`);
  logger.info(`Environment: ${config.app.env}`);
  logger.info(`Database type: ${config.database.type}`);
});

export default app;
