const express = require('express');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/privkey.pem', 'utf8');
const fullchain = fs.readFileSync('/etc/letsencrypt/live/senso.senselive.in/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: fullchain };

const app = express();

const port = 3050;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json());

app.use('/elkem', router);

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Authorization', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS server listening on port ${port}`);
});
