const express = require('express');
const client = require('prom-client');

const app = express();
client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request latency',
  labelNames: ['route'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer({ route: req.path });
  res.on('finish', () => {
    httpRequests.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    end();
  });
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/events', (req, res) => res.json([{ id: 1, name: 'HackGrid 2026' }]));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(5000, () => console.log('Backend running on port 5000'));