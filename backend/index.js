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

// Shared fallback path: study at Grainger Library then sleep at ECEB
const GRAINGER_COORDS = { lat: 40.1125, lng: -88.2267 };
const ECEB_COORDS = { lat: 40.1149, lng: -88.228 };

function buildGraingerFallbackPath(title) {
  const pathTitle = title || 'Fallback: Grainger Library + ECEB';
  return {
    title: pathTitle,
    fallback: true,
    schedule: [
      {
        time: '13:00',
        location: 'Grainger Library 2F',
        activity: 'Study at Grainger Library from 13:00 to 23:00.',
        coordinates: { ...GRAINGER_COORDS },
        notes: 'no where to go, sleep at grainger 2F.',
      },
      {
        time: '23:00',
        location: 'ECE Building (ECEB)',
        activity: 'Sleep at ECEB from 23:00 to 09:00.',
        coordinates: { ...ECEB_COORDS },
        notes: 'no where to go, sleep at grainger 2F.',
      },
    ],
  };
}

/**
 * Calls the Fireworks.ai API with a schedule-planning prompt (single attempt).
 * This uses dynamic import() for the ESM-only 'openai' package.
 */
async function callFireworksAPI({
  model = "accounts/fireworks/models/llama-v3p3-70b-instruct",
  promptArgs,
} = {}) {
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
  const basePrompt = buildFireworksPrompt(promptArgs);

  console.log(`Fireworks API call with model ${model}`);
  const response = await client.chat.completions.create({
    model,
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

  if (!content) {
    console.warn("Empty response content from Fireworks; using fallback schedule.");
    return {
      status: "LACK INFO",
      data: {
        reason: "Empty response from model; using fallback schedule at Grainger Library and ECEB.",
        pathResult: [buildGraingerFallbackPath()],
      },
    };
  }

  // Handle possible prefixes and extract JSON
  let status = "GOOD RESULT";
  let rest = content;

  if (rest.startsWith("GOOD RESULT")) {
    status = "GOOD RESULT";
    rest = rest.replace(/^GOOD RESULT\s*/i, "");
  } else if (rest.startsWith("LACK INFO")) {
    status = "LACK INFO";
    rest = rest.replace(/^LACK INFO\s*/i, "");
  } else {
    // If the model did not obey the flag rule, treat it as LACK INFO.
    status = "LACK INFO";
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
      console.warn("Failed to parse JSON from model output; will fall back to Grainger/ECEB.", err.message);
      parsed = null;
    }
  }

  // If we got valid JSON, enrich it with a reason and return
  if (parsed && typeof parsed === "object") {
    if (!Array.isArray(parsed.pathResult) || parsed.pathResult.length === 0) {
      console.warn("Parsed JSON has empty or missing pathResult; using fallback schedule.");
      parsed.pathResult = [buildGraingerFallbackPath()];
    }

    let reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason
        : outsideJsonText ||
          (status === "LACK INFO"
            ? "The model reported limited context; using a simplified schedule at Grainger Library and ECEB."
            : "Schedule generated based on the available context.");

    parsed.reason = normalizeReason(reason);
    return { status, data: parsed };
  }

  // No usable JSON: return fallback with reason
  const fallbackReason =
    outsideJsonText ||
    content ||
    "Model could not generate a structured schedule; using fallback at Grainger Library and ECEB.";

  return {
    status: "LACK INFO",
    data: {
      reason: normalizeReason(fallbackReason),
      pathResult: [buildGraingerFallbackPath()],
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

// LLM schedule generation endpoint: calls three different models and returns three options
app.post('/api/llm-schedules', async (req, res) => {
  try {
    const { userRequest, date } = req.body || {};

    const promptArgs = {
      userProfile: '{{user_profile_block}}',
      events: '{{events_block}}',
      buildings: '{{buildings_block}}',
      transit: '{{transit_block}}',
      weather: '{{weather_block}}',
      userRequest: userRequest || '{{user_request}}',
      targetDate: date || '{{target_date}}',
    };

    const models = [
      {
        id: 1,
        modelId: "accounts/fireworks/models/deepseek-v3p1",
        modelName: "DeepSeek v3.1",
      },
      {
        id: 2,
        modelId: "accounts/fireworks/models/qwen2p5-vl-32b-instruct",
        modelName: "Qwen3 VL 30B A3B Instruct",
      },
      {
        id: 3,
        modelId: "accounts/fireworks/models/llama-v3p3-70b-instruct",
        modelName: "Llama v3.3 70B Instruct",
      },
    ];

    const options = await Promise.all(
      models.map(async (m) => {
        try {
          const { status, data } = await callFireworksAPI({
            model: m.modelId,
            promptArgs,
          });

          const firstPath =
            Array.isArray(data.pathResult) && data.pathResult[0]
              ? data.pathResult[0]
              : null;

          const effectivePath =
            firstPath && Array.isArray(firstPath.schedule) && firstPath.schedule.length > 0
              ? firstPath
              : buildGraingerFallbackPath(`Option ${m.id}: Grainger Library 2F`);

          return {
            id: m.id,
            modelId: m.modelId,
            modelName: m.modelName,
            status,
            reason: data.reason || "",
            title: effectivePath.title || `Option ${m.id}`,
            schedule: effectivePath.schedule || [],
            isFallback: !!effectivePath.fallback,
          };
        } catch (err) {
          console.error(`LLM call failed for model ${m.modelId}:`, err);
          const fallbackPath = buildGraingerFallbackPath(`Option ${m.id}: Grainger Library 2F`);
          return {
            id: m.id,
            modelId: m.modelId,
            modelName: m.modelName,
            status: "FAILED",
            reason:
              err && typeof err.message === "string"
                ? err.message
                : "Failed to generate schedule; using fallback at Grainger Library.",
            title: fallbackPath.title,
            schedule: fallbackPath.schedule,
            isFallback: true,
          };
        }
      }),
    );

    res.json({ success: true, options });
  } catch (error) {
    console.error("Error in /api/llm-schedules:", error);
    res.status(500).json({ success: false, error: "server_error" });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
