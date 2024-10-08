const express = require('express');
const cors = require('cors');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');
const mail = require('./autoMails/autoMails');
const cron = require('node-cron');


const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();

const port = 3500;


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/elkem', router);
app.get('/elkem/test', (req, res) => {
  console.log('Received GET request to /api/example');
  res.send('Response from Node.js server');
});


cron.schedule('0 10 28-31 * *', mail.CheckSchedule);
cron.schedule('0 10 1-5 * *', mail.CheckSchedule);

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(3500, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
