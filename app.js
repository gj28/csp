const express = require('express');
const router = require('./routes');
const fs = require('fs');
const bodyParser = require('body-parser');


const app = express();

const port = 3000;


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

