const express = require('express');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const https = require('https');
const cors = require('cors'); // Import cors module

const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();

const port = 3050;

// Use cors middleware


app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json());
app.use('/elkem', router);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://elkem.senselive.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow the 'Authorization' header in the preflight response
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // Pass control to the next middleware
  next();
});


const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
