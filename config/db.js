const mongoose = require('mongoose');
const consola = require('consola');

class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) {
      return Database.#instance;
    }
    Database.#instance = this;
    this.connection = null;
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }

  async connect() {
    if (this.connection) {
      consola.info('Using existing MongoDB connection');
      return this.connection;
    }

    try {
      this.connection = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      consola.success('MongoDB connected');
      return this.connection;
    } catch (err) {
      consola.error('Database connection error:', err.message);
      process.exit(1);
    }
  }
}

module.exports = Database.getInstance();