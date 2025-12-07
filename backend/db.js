const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB', err);
  } else {
    console.log('SQLite DB connected at', dbPath);
  }
});

db.exec('PRAGMA foreign_keys = ON;');

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth0Sub TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`
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
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS building_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      key TEXT NOT NULL,
      building TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, key),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
});

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

function mapHistoryRow(row) {
  if (!row) return null;
  return {
    _id: row.id ? String(row.id) : undefined,
    id: row.id ? String(row.id) : undefined,
    user: row.userId,
    title: row.title,
    subtitle: row.subtitle,
    userRequest: row.userRequest,
    requestedDate: row.requestedDate,
    metadata: safeParse(row.metadata, {}),
    pathOptions: safeParse(row.pathOptions, []),
    createdAt: row.createdAt
  };
}

async function findOrCreateUser(auth0Sub, email, name) {
  let user = await dbGet(`SELECT * FROM users WHERE auth0Sub = ?`, [auth0Sub]);
  if (!user) {
    const createdAt = new Date().toISOString();
    const result = await dbRun(
      `INSERT INTO users (auth0Sub, email, name, createdAt) VALUES (?, ?, ?, ?)`,
      [auth0Sub, email, name, createdAt]
    );
    user = {
      id: result.lastID,
      auth0Sub,
      email,
      name,
      createdAt
    };
  }
  return user;
}

async function insertHistory(userId, { title, subtitle, userRequest, requestedDate, metadata, pathOptions }) {
  const requestedDateIso = requestedDate ? new Date(requestedDate).toISOString() : null;
  const createdAt = new Date().toISOString();

  const result = await dbRun(
    `INSERT INTO histories (userId, title, subtitle, userRequest, requestedDate, metadata, pathOptions, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      title || userRequest || '',
      subtitle || '',
      userRequest || '',
      requestedDateIso,
      JSON.stringify(metadata || {}),
      JSON.stringify(Array.isArray(pathOptions) ? pathOptions : []),
      createdAt
    ]
  );

  const inserted = await dbGet(`SELECT * FROM histories WHERE id = ?`, [result.lastID]);
  return mapHistoryRow(inserted);
}

async function listHistories(userId, limit, offset) {
  const rows = await dbAll(
    `SELECT * FROM histories WHERE userId = ?
     ORDER BY datetime(createdAt) DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows.map(mapHistoryRow);
}

async function getHistory(userId, id) {
  const row = await dbGet(`SELECT * FROM histories WHERE id = ? AND userId = ?`, [id, userId]);
  return mapHistoryRow(row);
}

async function listBuildingUsage(userId) {
  const rows = await dbAll(
    `SELECT key, building, count, updatedAt, createdAt FROM building_usage WHERE userId = ? ORDER BY count DESC`,
    [userId]
  );
  return rows || [];
}

async function incrementBuildingUsage(userId, pathOptions) {
  if (!Array.isArray(pathOptions)) return;
  for (const path of pathOptions) {
    const schedule = Array.isArray(path.schedule) ? path.schedule : [];
    for (const item of schedule) {
      const building = item && item.location ? String(item.location) : 'Unknown';
      const key = building.toLowerCase();
      const existing = await dbGet(
        `SELECT * FROM building_usage WHERE userId = ? AND key = ?`,
        [userId, key]
      );
      if (existing) {
        await dbRun(
          `UPDATE building_usage SET count = count + 1, updatedAt = datetime('now') WHERE id = ?`,
          [existing.id]
        );
      } else {
        await dbRun(
          `INSERT INTO building_usage (userId, key, building, count, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [userId, key, building, 1]
        );
      }
    }
  }
}

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  mapHistoryRow,
  findOrCreateUser,
  insertHistory,
  listHistories,
  getHistory,
  incrementBuildingUsage,
  listBuildingUsage,
  safeParse
};
