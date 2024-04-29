const express = require('express');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const https = require('https');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();

const port = 3050;

app.use(express.json());
app.use(bodyParser.json());

// Enable CORS for all origins
const corsOptions = {
  origin: '*'
};

app.use(cors(corsOptions));

app.use('/elkem', router);

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
