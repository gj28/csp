const express = require('express');
const router = require('./routes');
const mail = require('./autoMails/autoMails');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');
const cors = require('cors'); // Import cors module
const cron = require('node-cron');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();

const port = 3500;

// Use cors middleware
// app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json());
app.use('/elkem', router);
app.get('/elkem/test', (req, res) => {
  console.log('Received GET request to /elkem/test');
  res.send('Response from Node.js server');
});
app.use(cors());

cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });
