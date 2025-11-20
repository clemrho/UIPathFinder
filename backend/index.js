require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { buildFireworksPrompt } = require('../LLM/llmama');

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

/**
 * Calls the Fireworks.ai API with a test prompt.
 * This uses dynamic import() for the ESM-only 'openai' package.
 */
async function callFireworksAPI() {
  // Dynamically import the openai library
  const { default: OpenAI } = await import('openai');

  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error("FIREWORKS_API_KEY environment variable is not set.");
  }

  const client = new OpenAI({
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: "https://api.fireworks.ai/inference/v1",
  });

  // For now we call the prompt builder with default placeholder blocks.
  // Later, you can pass real context from MongoDB / external APIs.
  const basePrompt = buildFireworksPrompt();

  let attempts = 0;
  let lastContent = null;

  while (attempts < 3) {
    attempts += 1;
    console.log(`Fireworks API call attempt ${attempts}`);

    const response = await client.chat.completions.create({
      model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
      messages: [
        {
          role: "user",
          content: basePrompt,
        },
      ],
      max_tokens: 1500,
    });

    const rawContent = response.choices[0]?.message?.content || "";
    const content = rawContent.trim();
    lastContent = content;

    if (!content) {
      console.warn("Empty response content from Fireworks; retrying...");
      continue;
    }

    // Handle possible prefixes and extract JSON
    let status = "GOOD RESULT";
    let rest = content;

    if (rest.startsWith("GOOD RESULT")) {
      status = "GOOD RESULT";
      rest = rest.replace(/^GOOD RESULT\s*/i, "");
    } else if (rest.startsWith("NOT ENOUGH CONTEXT") || rest.startsWith("NOT ENOUGH TEXT")) {
      // Treat NOT ENOUGH CONTEXT / TEXT as a success status
      status = "NOT ENOUGH CONTEXT";
      rest = rest.replace(/^NOT ENOUGH CONTEXT\s*|^NOT ENOUGH TEXT\s*/i, "");
    } else if (rest.startsWith("NOT FINAL RESULT")) {
      status = "NOT FINAL RESULT";
      rest = rest.replace(/^NOT FINAL RESULT\s*/i, "");
      if (attempts < 3) {
        console.log('Model indicated "NOT FINAL RESULT". Retrying...');
        continue;
      }
      // On the 3rd attempt, fall through and try to use whatever is returned.
    }

    const firstBrace = rest.indexOf("{");
    const lastBrace = rest.lastIndexOf("}");
    const beforeJson = firstBrace === -1 ? rest : rest.slice(0, firstBrace).trim();
    const afterJson = lastBrace === -1 ? "" : rest.slice(lastBrace + 1).trim();
    const outsideJsonText = [beforeJson, afterJson].filter(Boolean).join(" ");

    const normalizeReason = (text) => {
      if (!text) return "";
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 150) {
        return words.slice(0, 150).join(" ");
      }
      return words.join(" ");
    };

    let parsed = null;

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonText = rest.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(jsonText);
      } catch (err) {
        console.warn("Failed to parse JSON from model output; will fall back to reason-only.", err.message);
        parsed = null;
      }
    }

    // If we got valid JSON, enrich it with a reason and return
    if (parsed && typeof parsed === "object") {
      // Enforce one pathResult element
      if (Array.isArray(parsed.pathResult) && parsed.pathResult.length > 1) {
        parsed.pathResult = [parsed.pathResult[0]];
      }

      if (!Array.isArray(parsed.pathResult) || parsed.pathResult.length === 0) {
        console.warn("Parsed JSON has empty or missing pathResult; treating as reason-only result.");
        parsed.pathResult = [];
      }

      let reason =
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason
          : outsideJsonText ||
            (status === "NOT ENOUGH CONTEXT"
              ? "The model reported limited context when generating this schedule; details may be incomplete."
              : "Schedule generated based on the available context.");

      parsed.reason = normalizeReason(reason);
      return { status, data: parsed };
    }

    // No usable JSON: still return a structured JSON with a reason
    const reasonText =
      outsideJsonText ||
      content ||
      "Model could not generate a structured schedule with the given context.";
    const reason = normalizeReason(reasonText);

    return {
      status,
      data: {
        reason,
        pathResult: [],
      },
    };
  }

  // After 3 attempts, fallback JSON
  const fallbackReason =
    lastContent || "Model did not return a usable schedule after multiple attempts.";
  return {
    status: "FAILED",
    data: {
      reason: fallbackReason,
      pathResult: [],
    },
  };
}

// Unprotected route to test Fireworks.ai integration
app.get('/api/fireworks-test', async (req, res) => {
  try {
    console.log("Received request for /api/fireworks-test");
    const { status, data } = await callFireworksAPI();
    res.json({ success: true, status, ...data });
  } catch (error) {
    console.error("Fireworks API test error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
