require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyber-soc';

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('tiny'));

app.use('/auth', authRoutes);
app.use('/', apiRoutes);

mongoose
  .connect(mongoUri, {family: 4})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`API server running on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });
