import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import express from 'express';
import WebSocket from 'isomorphic-ws';
globalThis.WebSocket = WebSocket as any;
dotenv.config();
import * as Kaspa from './kaspa/kaspa.js';
import {
  ConnectStrategy,
  createTransactions,
  Encoding,
  kaspaToSompi,
  Mnemonic,
  PrivateKeyGenerator,
  Resolver,
  RpcClient,
  XPrv
} from './kaspa/kaspa.js';
import { TurnstileResponse } from './models/turnstile-response.js';
import fetch from 'node-fetch';

// Initialize Kaspa framework
console.log('Initializing kaspa framework...');
Kaspa.initConsolePanicHook();

// Express app setup
const app = express();
app.use(express.json());

// Setup globals
const networkId = 'mainnet';
const KAS_FYI_KEY = process.env.KAS_FYI_KEY ?? 'MISSING'; // https://docs.kas.fyi/
const MNEMONIC = process.env.MNEMONIC ?? 'MISSING'; // Best practice: wallet contains small balance
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? 'MISSING'; // Cloudflare recaptcha
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const MAX_FEE = kaspaToSompi("0.01") ?? 0n;
const PRIORITY_FEE = kaspaToSompi("0.0001") ?? 0n;
const MIN_SEND_AMOUNT = kaspaToSompi("0.2") ?? 0n;

// Enhanced CORS middleware for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowedOrigin = allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin));

  res.header('Access-Control-Allow-Origin', isAllowedOrigin ? origin : 'null');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, cf-turnstile-response');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Turnstile recaptcha middleware
const turnstileProtectedRoutes = ['/api/v1/transactions/:id', '/api/v1/inscribe'];
app.use(turnstileProtectedRoutes, async (req, res, next) => {
  const turnstileToken = req.headers['cf-turnstile-response'] as string;
  const remoteIp = req.ip;
  const turnstileResult = await validateTurnstile(turnstileToken, remoteIp);
  if (!turnstileResult.success) {
    res.status(400).send('Invalid turnstile token');
    return;
  }
  next();
});

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Transaction fetch endpoint
app.get('/api/v1/transactions/:id', async (req: Request, res: Response) => {
  // Validate params
  const id = req.params.id;
  if (!id || typeof id !== 'string' || id.length !== 64 || !/^[a-fA-F0-9]+$/.test(id)) {
    res.status(400).send('Invalid transaction ID format. Must be a 64-character hexadecimal string.');
    return;
  }

  // Create apiUrl
  const archivalNode = req.query.archivalNode;
  if (!archivalNode || (archivalNode !== 'kas.fyi' && archivalNode !== 'kaspa.org')) {
    res.status(400).send('Invalid or missing archivalNode parameter. Must be "kas.fyi" or "kaspa.org".');
    return;
  }
  let apiUrl = `https://api.kas.fyi/v1/transactions/${id}?include_payload=true`;
  if (archivalNode === 'kaspa.org') {
    apiUrl = `https://api.kaspa.org/transactions/${id}`;
  }

  try {
    // Fetch transaction
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'x-api-key': KAS_FYI_KEY },
    });
    let data = await response.json();

    // Unify data structure
    if (archivalNode === 'kas.fyi') {
      // Flatten {transaction: {...}} to {...}
      if (data && typeof data === 'object' && 'transaction' in data && typeof data.transaction === 'object') {
        data = data.transaction;
      }

      // Parse fields from string to int using an array
      const intFields = ['blockTime'];
      if (data && typeof data === 'object') {
        intFields.forEach(field => {
          if (typeof (data as any)[field] === 'string') {
            const parsed = parseInt((data as any)[field], 10);
            if (!isNaN(parsed)) {
              (data as any)[field] = parsed;
            }
          }
        });
      }
    }
    else {
      // Map snake_case to camelCase
      const snakeToCamel = (str: string) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const mapKeys = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(mapKeys);
        } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [snakeToCamel(k), mapKeys(v)])
          );
        }
        return obj;
      };
      data = mapKeys(data);
    }

    res.status(response.status).json(data);
  } catch (ex) {
    console.error('Error fetching transaction:', ex);
    res.status(500).send('Error fetching transaction');
  }
});

// Inscribe endpoint
app.post('/api/v1/inscribe', async (req: Request, res: Response) => {
  console.log('Inscribe request received');
  let rpc: RpcClient | undefined;
  try {
    // Validate params
    const provingHash = req.body.hash;
    if (!provingHash) {
      res.status(400).send('Missing hash in request body');
      return;
    }
    if (typeof provingHash !== 'string' || provingHash.length !== 64 || !/^[a-fA-F0-9]+$/.test(provingHash)) {
      res.status(400).send('Invalid hash format. Must be a 64-character hexadecimal string.');
      return;
    }

    // Setup RPC
    // Vercel uses serverless functions, so we need to create a new RPC client for each request
    // In a server environment, reuse the RPC client for better performance
    // This also avoids spamming the RPC with multiple connections
    rpc = new RpcClient({
      networkId,
      resolver: new Resolver(),
      encoding: Encoding.Borsh,
    });
    await rpc.connect({
      strategy: ConnectStrategy.Retry,
    });
    const { isSynced } = await rpc.getServerInfo();
    if (!isSynced) {
      throw new Error('RPC is not synced');
    }

    // Setup address
    const mnemonic = new Mnemonic(MNEMONIC);
    const xprv = new XPrv(mnemonic.toSeed());
    const privateKey = new PrivateKeyGenerator(xprv, false, 0n).receiveKey(0);
    const address = privateKey.toKeypair().toAddress(networkId);

    // Fetch UTXOs
    const { entries } = await rpc.getUtxosByAddresses([address]);
    if (!entries.length) {
      throw new Error(`No UTXOs found for address ${address} (no balance)`);
    }
    entries.sort((a, b) => a.amount > b.amount ? 1 : -1);

    // Build transactions (send to self)
    let { transactions, summary } = await createTransactions({
      entries,
      outputs: [{ address, amount: MIN_SEND_AMOUNT }],
      priorityFee: PRIORITY_FEE,
      changeAddress: address,
      payload: provingHash, // Inscribe the hash
      networkId,
    });

    // Submit transactions
    let txid = '';
    for (let pending of transactions) {
      // Disable service if fee is too high
      if (pending.feeAmount > MAX_FEE) {
        throw new Error(`High network fees. Please try again later or deploy your own instance.`);
      }
      pending.sign([privateKey]);
      txid = await pending.submit(rpc);
    }

    res.status(200).json({ txid });
  } catch (ex) {
    console.error('Error creating transaction:', ex);
    res.status(500).send('Error creating transaction');
  }

  // Cleanup RPC
  if (rpc) {
    try {
      await rpc.disconnect();
    }
    catch (ex) {
      console.error('Error disconnecting RPC:', ex);
    }
  }
});

const INVALID_TURNSTILE_RESPONSE: TurnstileResponse = {
  success: false, 'error-codes': ['internal-error'], challenge_ts: '',
  hostname: '', action: '', cdata: '', metadata: { ephemeral_id: '' }
};
const validateTurnstile = async (token: string, remoteip: string | undefined): Promise<TurnstileResponse> => {
  if (!token) {
    const error = INVALID_TURNSTILE_RESPONSE;
    error['error-codes'] = ['missing-input-response'];
    return error;
  }

  const formData = new FormData();
  formData.append('secret', TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (remoteip) {
    formData.append('remoteip', remoteip);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    return result as TurnstileResponse;
  } catch (error) {
    console.error('Turnstile validation error:', error);
    return INVALID_TURNSTILE_RESPONSE
  }
}

export default app;
