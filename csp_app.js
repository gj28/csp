// const express = require('express');
// const cors = require('cors');
// const router = require('./routes');
// const fs = require('fs');
// const bodyParser = require('body-parser');
// const https = require('https');
// const mail = require('./autoMails/autoMails');
// const cron = require('node-cron');


// const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
// const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
// const credentials = { key: privateKey, cert: fullchain };

// const app = express();

// const port = 3500;

// const allowedOrigins = ['https://elkem.senselive.in', 'http://localhost:4200'];


// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// app.use('/elkem', router);
// app.get('/elkem/test', (req, res) => {
//   console.log('Received GET request to /api/example');
//   res.send('Response from Node.js server');
// });

// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (!allowedOrigins.includes(origin)) {
//     // Serve the access denied HTML page if the origin is not allowed
//     return res.status(403).sendFile(path.join(__dirname, 'public', 'access_denied.html'));
//   }
//   next();
// });

// cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
// cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

// const httpsServer = https.createServer(credentials, app);

// httpsServer.listen(3500, () => {
//   console.log(`HTTPS server listening on port ${port}`);
// });
const express = require('express');
const cors = require('cors');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');
const mail = require('./autoMails/autoMails');
const cron = require('node-cron');
const path = require('path');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.io/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.io/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();
const port = 3500;

const allowedOrigins = ['https://elkem.senselive.in', 'http://localhost:4200'];

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); 
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Middleware to check origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!allowedOrigins.includes(origin)) {
    // Serve the access denied HTML page if the origin is not allowed
    return res.status(403).sendFile(path.join(__dirname, 'public', 'access_denied.html'));
  }
  next();
});

// Define your routes
app.use('/elkem', router);
app.get('/elkem/test', (req, res) => {
  console.log('Received GET request to /elkem/test');
  res.send('Response from Node.js server');
});

// Scheduled tasks
cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
