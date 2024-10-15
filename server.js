const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

app.use('/model1', express.static(path.join(__dirname, 'public/model1')));
app.use('/model2', express.static(path.join(__dirname, 'public/model2')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
