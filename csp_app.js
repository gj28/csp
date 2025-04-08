const express = require('express');
const cors = require('cors');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');
const path = require('path');
const mail = require('./autoMails/autoMails');
const cron = require('node-cron');

// SSL credentials
const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.io/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.io/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();
const port = 3500;

// Allowed origins for CORS
const allowedOrigins = ['https://elkem.senselive.in', 'http://localhost:4200'];

// CORS middleware configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight (OPTIONS) requests
app.options('*', cors(corsOptions));

// Request parsers
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/elkem', router);
app.get('/elkem/test', (req, res) => {
  console.log('Received GET request to /elkem/test');
  res.send('Response from Node.js server');
});

// CRON jobs for scheduled emails
cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

// Error handling middleware
app.use((err, req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Serve access denied HTML if needed (optional fallback, e.g., in routes)
app.get('/access-denied', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'access_denied.html'));
});

// Start HTTPS server
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
  console.log(`✅ HTTPS server listening on port ${port}`);
});
