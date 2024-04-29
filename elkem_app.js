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
app.use(cors());

app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json());
app.use('/elkem', router);

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
