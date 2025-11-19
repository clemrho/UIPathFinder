require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const User = require('./models/user');
const History = require('./models/history');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/uipathfinder';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth0 JWT verification using jwks-rsa + jsonwebtoken
const jwksClient = jwksRsa({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true
});

function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const pubkey = key.getPublicKey ? key.getPublicKey() : key.publicKey;
    callback(null, pubkey);
  });
}

function checkJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
  const token = authHeader.split(' ')[1];
  const audience = process.env.AUTH0_AUDIENCE || 'urn:uipathfinder-api';
  const issuer = `https://${process.env.AUTH0_DOMAIN}/`;
  jwt.verify(token, getKey, { audience, issuer }, (err, decoded) => {
    if (err) {
      console.error('JWT verify error:', err);
      return res.status(401).json({ error: 'invalid_token' });
    }
    req.auth = { payload: decoded };
    next();
  });
}

// Unprotected example API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express backend!' });
});

// Protected routes for histories
// Create a new history (save search + path options)
app.post('/api/histories', checkJwt, async (req, res) => {
  try {
    const authPayload = req.auth && req.auth.payload;
    const auth0Sub = authPayload && authPayload.sub;
    if (!auth0Sub) return res.status(401).json({ error: 'Unauthorized' });

    // Upsert user
    const email = authPayload.email || req.body.email || null;
    const name = authPayload.name || req.body.name || null;
    let user = await User.findOne({ auth0Sub });
    if (!user) {
      user = await User.create({ auth0Sub, email, name });
    }

    const { title, subtitle, userRequest, requestedDate, metadata, pathOptions } = req.body;
    const history = await History.create({
      user: user._id,
      title: title || userRequest || '',
      subtitle: subtitle || '',
      userRequest,
      requestedDate: requestedDate ? new Date(requestedDate) : undefined,
      metadata: metadata || {},
      pathOptions: Array.isArray(pathOptions) ? pathOptions : []
    });

    // Return the full history document so the frontend can update its local state
    res.status(201).json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// List histories for authenticated user
app.get('/api/histories', checkJwt, async (req, res) => {
  try {
    const authPayload = req.auth && req.auth.payload;
    const auth0Sub = authPayload && authPayload.sub;
    if (!auth0Sub) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ auth0Sub });
    if (!user) return res.json([]);

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const rows = await History.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('-__v')
      .lean();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Get a single history by id (only if belongs to user)
app.get('/api/histories/:id', checkJwt, async (req, res) => {
  try {
    const authPayload = req.auth && req.auth.payload;
    const auth0Sub = authPayload && authPayload.sub;
    if (!auth0Sub) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findOne({ auth0Sub });
    if (!user) return res.status(404).json({ error: 'Not found' });

    const history = await History.findOne({ _id: req.params.id, user: user._id }).lean();
    if (!history) return res.status(404).json({ error: 'Not found' });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
