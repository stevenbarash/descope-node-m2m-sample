import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import DescopeClient from '@descope/node-sdk';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa'; // For fetching Descope's public keys
import winston from 'winston';

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Validate required configuration at startup
const projectId = process.env.DESCOPE_PROJECT_ID;
const accessKey = process.env.DESCOPE_ACCESS_KEY;
if (!projectId || !accessKey) {
  logger.error('Missing required environment variables: DESCOPE_PROJECT_ID and/or DESCOPE_ACCESS_KEY');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Descope client for M2M authentication
const descopeClient = DescopeClient({
  projectId,
  managementKey: accessKey,
});

// Setup JWKS client for Descope public keys (for JWT verification)
const jwksUri = `https://api.descope.com/${projectId}/.well-known/jwks.json`;
const client = jwksClient({ jwksUri });

// Helper function for jsonwebtoken to retrieve the correct public key from JWKS
function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Home page route
app.get('/', (req, res) => {
  res.render('index', {
    projectId,
  });
});

// M2M endpoint: Exchanges the access key for a JWT using Descope SDK
app.post('/m2m/token', async (req, res, next) => {
  const reqProjectId = req.body.projectId || projectId;
  const reqAccessKey = req.body.accessKey || accessKey;
  const scopes = req.body.scopes;
  try {
    logger.info('Attempting to exchange access key...');
    const tempDescopeClient = DescopeClient({
      projectId: reqProjectId,
      managementKey: reqAccessKey,
    });
    let loginOptions = undefined;
    if (Array.isArray(scopes) && scopes.length > 0) {
      loginOptions = { customClaims: { scope: scopes.join(' ') } };
    }
    const authInfo = await tempDescopeClient.exchangeAccessKey(reqAccessKey, loginOptions);
    logger.info('Received auth info');
    if (!authInfo || !authInfo.jwt) {
      throw new Error('No JWT received from Descope');
    }
    const decodedPayload = jwt.decode(authInfo.jwt);
    const decodedHeader = jwt.decode(authInfo.jwt, { complete: true })?.header;
    res.json({
      success: true,
      jwt: authInfo.jwt,
      decodedPayload,
      decodedHeader,
    });
  } catch (err) {
    logger.error('M2M Authentication failed', { error: err.message });
    next({ status: 401, message: err.message || 'Authentication failed' });
  }
});

// Protected API endpoint: Verifies JWT using Descope's public key
app.post('/api/protected', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next({ status: 401, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    // Promisify jwt.verify
    const verifyJwt = (token) => new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
    const decoded = await verifyJwt(token);
    res.json({ success: true, message: 'Protected API call succeeded!', claims: decoded });
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message });
    next({ status: 401, message: 'JWT verification failed: ' + err.message });
  }
});

// New: /api/user endpoint (requires 'read:data' scope)
app.post('/api/user', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next({ status: 401, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    const verifyJwt = (token) => new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
    const decoded = await verifyJwt(token);
    // Check for 'read:data' scope
    const scopes = extractScopes(decoded);
    if (!scopes.includes('read:data')) {
      return res.status(403).json({ success: false, error: "Missing required scope: 'read:data'" });
    }
    res.json({ success: true, message: 'User API call succeeded!', claims: decoded });
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message });
    next({ status: 401, message: 'JWT verification failed: ' + err.message });
  }
});

// New: /api/admin endpoint (requires 'admin' scope)
app.post('/api/admin', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next({ status: 401, message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    const verifyJwt = (token) => new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
    const decoded = await verifyJwt(token);
    // Check for 'admin' scope
    const scopes = extractScopes(decoded);
    if (!scopes.includes('admin')) {
      return res.status(403).json({ success: false, error: "Missing required scope: 'admin'" });
    }
    res.json({ success: true, message: 'Admin API call succeeded!', claims: decoded });
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message });
    next({ status: 401, message: 'JWT verification failed: ' + err.message });
  }
});

// Helper to extract scopes from JWT claims
function extractScopes(decoded) {
  let scopes = [];
  if (decoded.scope) {
    if (Array.isArray(decoded.scope)) scopes = decoded.scope;
    else if (typeof decoded.scope === 'string') scopes = decoded.scope.split(' ');
  }
  if (decoded.scopes) {
    if (Array.isArray(decoded.scopes)) scopes = scopes.concat(decoded.scopes);
    else if (typeof decoded.scopes === 'string') scopes = scopes.concat(decoded.scopes.split(' '));
  }
  return Array.from(new Set(scopes));
}

// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error handler:', { error: err.message, status: err.status });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start the Express server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});