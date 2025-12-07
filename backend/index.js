require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { buildFireworksPrompt } = require('../LLM/llmama');
const {
  findOrCreateUser,
  insertHistory,
  listHistories,
  getHistory,
  incrementBuildingUsage,
  listBuildingUsage
} = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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

// Optional auth: use Auth0 token if provided; otherwise fall back to a local guest user
async function resolveUser(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const audience = process.env.AUTH0_AUDIENCE || 'urn:uipathfinder-api';
    const issuer = `https://${process.env.AUTH0_DOMAIN}/`;
    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, { audience, issuer }, (err, payload) => {
          if (err) reject(err);
          else resolve(payload);
        });
      });
      req.auth = { payload: decoded };
      return await findOrCreateUser(
        decoded.sub,
        decoded.email || null,
        decoded.name || null
      );
    } catch (err) {
      console.error('JWT verify error:', err);
      throw new Error('invalid_token');
    }
  }
  // guest user for local usage without Auth0
  return await findOrCreateUser('guest-local', null, 'Local Guest');
}

// Unprotected example API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express backend!' });
});

// Protected routes for histories
// Create a new history (save search + path options)
app.post('/api/histories', async (req, res) => {
  try {
    const user = await resolveUser(req, res);

    const {
      title,
      subtitle,
      userRequest,
      requestedDate,
      metadata,
      pathOptions
    } = req.body;

    const inserted = await insertHistory(user.id, {
      title,
      subtitle,
      userRequest,
      requestedDate,
      metadata,
      pathOptions
    });

    await incrementBuildingUsage(user.id, Array.isArray(pathOptions) ? pathOptions : []);

    // Return the full history document so the frontend can update its local state
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    if (err.message === 'invalid_token') {
      return res.status(401).json({ error: 'invalid_token' });
    }
    res.status(500).json({ error: 'server_error' });
  }
});

// List histories for authenticated user
app.get('/api/histories', async (req, res) => {
  try {
    const user = await resolveUser(req, res);
    if (!user) return res.json([]);

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const rows = await listHistories(user.id, limit, offset);

    res.json(rows);
  } catch (err) {
    console.error(err);
    if (err.message === 'invalid_token') {
      return res.status(401).json({ error: 'invalid_token' });
    }
    res.status(500).json({ error: 'server_error' });
  }
});

// Get a single history by id (only if belongs to user)
app.get('/api/histories/:id', async (req, res) => {
  try {
    const user = await resolveUser(req, res);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const history = await getHistory(user.id, req.params.id);
    if (!history) return res.status(404).json({ error: 'Not found' });

    res.json(history);
  } catch (err) {
    console.error(err);
    if (err.message === 'invalid_token') {
      return res.status(401).json({ error: 'invalid_token' });
    }
    res.status(500).json({ error: 'server_error' });
  }
});

// Building usage stats
app.get('/api/building-usage', async (req, res) => {
  try {
    const user = await resolveUser(req, res);
    if (!user) return res.json([]);
    const rows = await listBuildingUsage(user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    if (err.message === 'invalid_token') {
      return res.status(401).json({ error: 'invalid_token' });
    }
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
        notes: 'no where to go, sleep at grainger 2F.'
      },
      {
        time: '23:00',
        location: 'ECE Building (ECEB)',
        activity: 'Sleep at ECEB from 23:00 to 09:00.',
        coordinates: { ...ECEB_COORDS },
        notes: 'no where to go, sleep at grainger 2F.'
      }
    ]
  };
}

/**
 * ⭐ New: get driving route between two coordinates using OSRM demo server
 * Returns an array of { lat, lng } along the road.
 */
async function getDrivingRoute(startCoords, endCoords) {
  try {
    if (
      !startCoords ||
      !endCoords ||
      typeof startCoords.lat !== 'number' ||
      typeof startCoords.lng !== 'number' ||
      typeof endCoords.lat !== 'number' ||
      typeof endCoords.lng !== 'number'
    ) {
      return [];
    }

    const start = `${startCoords.lng},${startCoords.lat}`;
    const end = `${endCoords.lng},${endCoords.lat}`;

    const url =
      `http://router.project-osrm.org/route/v1/driving/` +
      `${start};${end}?overview=full&geometries=geojson&steps=false`;

    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn('OSRM request failed with status', resp.status);
      return [];
    }

    const data = await resp.json();
    if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
      return [];
    }

    const coords = data.routes[0].geometry.coordinates; // [ [lng,lat], ... ]
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch (err) {
    console.warn('OSRM error:', err.message || err);
    return [];
  }
}

/**
 * Calls the Fireworks.ai API with a schedule-planning prompt (single attempt).
 * This uses dynamic import() for the ESM-only 'openai' package.
 */
async function callFireworksAPI({
  model = 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  promptArgs
} = {}) {
  // Dynamically import the openai library
  const { default: OpenAI } = await import('openai');

  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error('FIREWORKS_API_KEY environment variable is not set.');
  }

  const client = new OpenAI({
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: 'https://api.fireworks.ai/inference/v1'
  });

  // For now we call the prompt builder with default placeholder blocks.
  // Later, you can pass real context from MongoDB / external APIs.
  const basePrompt = buildFireworksPrompt(promptArgs);

  console.log(`Fireworks API call with model ${model}`);
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: basePrompt
      }
    ],
    max_tokens: 1500
  });

  const rawContent = response.choices[0]?.message?.content || '';
  const content = rawContent.trim();

  if (!content) {
    console.warn('Empty response content from Fireworks; using fallback schedule.');
    return {
      status: 'LACK INFO',
      data: {
        reason:
          'Empty response from model; using fallback schedule at Grainger Library and ECEB.',
        pathResult: [buildGraingerFallbackPath()]
      }
    };
  }

  // Handle possible prefixes and extract JSON
  let status = 'GOOD RESULT';
  let rest = content;

  if (rest.startsWith('GOOD RESULT')) {
    status = 'GOOD RESULT';
    rest = rest.replace(/^GOOD RESULT\s*/i, '');
  } else if (rest.startsWith('LACK INFO')) {
    status = 'LACK INFO';
    rest = rest.replace(/^LACK INFO\s*/i, '');
  } else {
    // If the model did not obey the flag rule, treat it as LACK INFO.
    status = 'LACK INFO';
  }

  const firstBrace = rest.indexOf('{');
  const lastBrace = rest.lastIndexOf('}');
  const beforeJson = firstBrace === -1 ? rest : rest.slice(0, firstBrace).trim();
  const afterJson = lastBrace === -1 ? '' : rest.slice(lastBrace + 1).trim();
  const outsideJsonText = [beforeJson, afterJson].filter(Boolean).join(' ');

  const normalizeReason = (text) => {
    if (!text) return '';
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 150) {
      return words.slice(0, 150).join(' ');
    }
    return words.join(' ');
  };

  let parsed = null;

  if (firstBrace !== -1 && lastBrace !== -1) {
    const jsonText = rest.slice(firstBrace, lastBrace + 1);
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.warn(
        'Failed to parse JSON from model output; will fall back to Grainger/ECEB.',
        err.message
      );
      parsed = null;
    }
  }

  // If we got valid JSON, enrich it with a reason and return
  if (parsed && typeof parsed === 'object') {
    if (!Array.isArray(parsed.pathResult) || parsed.pathResult.length === 0) {
      console.warn(
        'Parsed JSON has empty or missing pathResult; using fallback schedule.'
      );
      parsed.pathResult = [buildGraingerFallbackPath()];
    }

    let reason =
      typeof parsed.reason === 'string' && parsed.reason.trim()
        ? parsed.reason
        : outsideJsonText ||
          (status === 'LACK INFO'
            ? 'The model reported limited context; using a simplified schedule at Grainger Library and ECEB.'
            : 'Schedule generated based on the available context.');

    parsed.reason = normalizeReason(reason);
    return { status, data: parsed };
  }

  // No usable JSON: return fallback with reason
  const fallbackReason =
    outsideJsonText ||
    content ||
    'Model could not generate a structured schedule; using fallback at Grainger Library and ECEB.';

  return {
    status: 'LACK INFO',
    data: {
      reason: normalizeReason(fallbackReason),
      pathResult: [buildGraingerFallbackPath()]
    }
  };
}

// Unprotected route to test Fireworks.ai integration
app.get('/api/fireworks-test', async (req, res) => {
  try {
    console.log('Received request for /api/fireworks-test');
    const { status, data } = await callFireworksAPI();
    res.json({ success: true, status, ...data });
  } catch (error) {
    console.error('Fireworks API test error:', error.message);
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
      targetDate: date || '{{target_date}}'
    };

    const models = [
      {
        id: 1,
        modelId: 'accounts/fireworks/models/qwen2p5-vl-32b-instruct',
        modelName: 'Qwen3 VL 30B A3B Instruct'
      },
      {
        id: 2,
        modelId: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        modelName: 'Llama v3.3 70B Instruct'
      }
    ];

    const options = await Promise.all(
      models.map(async (m) => {
        try {
          const { status, data } = await callFireworksAPI({
            model: m.modelId,
            promptArgs
          });

          const firstPath =
            Array.isArray(data.pathResult) && data.pathResult[0]
              ? data.pathResult[0]
              : null;

          const effectivePath =
            firstPath &&
            Array.isArray(firstPath.schedule) &&
            firstPath.schedule.length > 0
              ? firstPath
              : buildGraingerFallbackPath(`Option ${m.id}: Grainger Library 2F`);

          const schedule = effectivePath.schedule || [];

          // ⭐ New: build road-aware routes for each leg using OSRM
          const segments = [];
          for (let i = 0; i < schedule.length - 1; i++) {
            const start = schedule[i].coordinates;
            const end = schedule[i + 1].coordinates;
            const route = await getDrivingRoute(start, end); // may be empty []

            segments.push({
              fromIndex: i,
              toIndex: i + 1,
              route
            });
          }

          return {
            id: m.id,
            modelId: m.modelId,
            modelName: m.modelName,
            status,
            reason: data.reason || '',
            title: effectivePath.title || `Option ${m.id}`,
            schedule,
            segments, // ⭐ 给前端的真路线数据
            isFallback: !!effectivePath.fallback
          };
        } catch (err) {
          console.error(`LLM call failed for model ${m.modelId}:`, err);
          const fallbackPath = buildGraingerFallbackPath(
            `Option ${m.id}: Grainger Library 2F`
          );
          const schedule = fallbackPath.schedule || [];

          // 即便是 fallback，也给一份（可能是空的）segments，前端逻辑更统一
          const segments = [];
          for (let i = 0; i < schedule.length - 1; i++) {
            const start = schedule[i].coordinates;
            const end = schedule[i + 1].coordinates;
            const route = await getDrivingRoute(start, end);
            segments.push({
              fromIndex: i,
              toIndex: i + 1,
              route
            });
          }

          return {
            id: m.id,
            modelId: m.modelId,
            modelName: m.modelName,
            status: 'FAILED',
            reason:
              err && typeof err.message === 'string'
                ? err.message
                : 'Failed to generate schedule; using fallback at Grainger Library.',
            title: fallbackPath.title,
            schedule,
            segments,
            isFallback: true
          };
        }
      })
    );

    res.json({ success: true, options });
  } catch (error) {
    console.error('Error in /api/llm-schedules:', error);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
