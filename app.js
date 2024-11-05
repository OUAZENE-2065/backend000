const express = require('express');
const userAuthRouter = require('./server/routers/userAuthentification');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/signlog', userAuthRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
