const express = require('express');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package

const app = express();

const port = 3000;

app.use(express.json());
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
