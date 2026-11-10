'use strict';
const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
}

module.exports = { connectDb };
