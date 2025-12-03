const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH =
  process.env.SQLITE_PATH || path.join(__dirname, 'uipathfinder.sqlite3');

let db;

function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);

      db.serialize(() => {
        db.run(
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            auth0Sub TEXT UNIQUE NOT NULL,
            email TEXT,
            name TEXT,
            createdAt TEXT NOT NULL
          )`,
        );

        db.run(
          `CREATE TABLE IF NOT EXISTS histories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            title TEXT,
            subtitle TEXT,
            userRequest TEXT,
            requestedDate TEXT,
            metadata TEXT,
            pathOptions TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          )`,
          (err2) => {
            if (err2) return reject(err2);
            resolve();
          },
        );
      });
    });
  });
}

function getUserByAuth0Sub(auth0Sub) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE auth0Sub = ?',
      [auth0Sub],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      },
    );
  });
}

function upsertUser({ auth0Sub, email, name }) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO users (auth0Sub, email, name, createdAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(auth0Sub) DO UPDATE SET
         email=excluded.email,
         name=excluded.name`,
      [auth0Sub, email, name, now],
      function (err) {
        if (err) return reject(err);
        getUserByAuth0Sub(auth0Sub)
          .then(resolve)
          .catch(reject);
      },
    );
  });
}

function createHistory({
  userId,
  title,
  subtitle,
  userRequest,
  requestedDate,
  metadata,
  pathOptions,
}) {
  return new Promise((resolve, reject) => {
    const createdAt = new Date().toISOString();
    const requestedDateStr = requestedDate
      ? new Date(requestedDate).toISOString()
      : null;
    const metadataJson = JSON.stringify(metadata || {});
    const pathOptionsJson = JSON.stringify(pathOptions || []);

    db.run(
      `INSERT INTO histories
       (userId, title, subtitle, userRequest, requestedDate, metadata, pathOptions, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        subtitle,
        userRequest,
        requestedDateStr,
        metadataJson,
        pathOptionsJson,
        createdAt,
      ],
      function (err) {
        if (err) return reject(err);
        const id = this.lastID;
        getHistoryById(id, userId)
          .then(resolve)
          .catch(reject);
      },
    );
  });
}

function listHistoriesByUser(userId, { limit = 20, offset = 0 } = {}) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM histories
       WHERE userId = ?
       ORDER BY datetime(createdAt) DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
      (err, rows) => {
        if (err) return reject(err);
        const mapped = (rows || []).map((row) => mapHistoryRow(row));
        resolve(mapped);
      },
    );
  });
}

function getHistoryById(id, userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM histories WHERE id = ? AND userId = ?',
      [id, userId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(mapHistoryRow(row));
      },
    );
  });
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    _id: row.id, // keep compatibility with previous Mongo shape
    user: row.userId,
    title: row.title,
    subtitle: row.subtitle,
    userRequest: row.userRequest,
    requestedDate: row.requestedDate,
    metadata: safeParseJson(row.metadata, {}),
    pathOptions: safeParseJson(row.pathOptions, []),
    createdAt: row.createdAt,
  };
}

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = {
  initDb,
  getUserByAuth0Sub,
  upsertUser,
  createHistory,
  listHistoriesByUser,
  getHistoryById,
};

