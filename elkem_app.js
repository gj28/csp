const express = require('express');
const cors = require('cors');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const mail = require('./autoMails/autoMails');
const cron = require('node-cron');
const path = require('path');

const app = express();
const port = 3500;

// CORS Configuration
const allowedOrigins = ['https://elkem.senselive.in', 'http://localhost:4200']; // Update with your actual allowed origins

// Middleware to check origin
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (!allowedOrigins.includes(origin)) {
//     // Serve the access denied HTML page if the origin is not allowed
//     return res.status(403).sendFile(path.join(__dirname, 'public', 'access_denied.html'));
//   }
//   next();
// });

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/elkem', router);
app.get('/elkem/test', (req, res) => {
  console.log('Received GET request to /elkem/test');
  res.send('Response from Node.js server');
});

// Cron jobs for scheduled tasks
cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
