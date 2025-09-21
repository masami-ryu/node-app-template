import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  JsonRpcSuccess,
  InitializeParams,
  InitializeResult
} from './types.js';

const rl = createInterface({ input });

let initialized = false;
let shuttingDown = false;

function send(response: JsonRpcResponse) {
  output.write(JSON.stringify(response) + '\n');
}

function error(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  const resp: JsonRpcError = { jsonrpc: '2.0', id: id ?? null, error: { code, message, data } };
  send(resp);
}

function success(id: JsonRpcRequest['id'], result: unknown) {
  const resp: JsonRpcSuccess = { jsonrpc: '2.0', id: id ?? null, result };
  send(resp);
}

function handleRequest(req: JsonRpcRequest) {
  if (req.jsonrpc !== '2.0') {
    return error(req.id, -32600, 'Invalid JSON-RPC version');
  }

  switch (req.method) {
    case 'initialize': {
      const params = (req.params || {}) as InitializeParams;
      const result: InitializeResult = {
        serverName: 'node-app-template-mcp-server',
        capabilities: { ping: true }
      };
      initialized = true;
      return success(req.id, result);
    }
    case 'ping': {
      if (!initialized) return error(req.id, -32002, 'Server not initialized');
      return success(req.id, { pong: true, timestamp: Date.now() });
    }
    case 'shutdown': {
      shuttingDown = true;
      return success(req.id, {});
    }
    case 'exit': {
      process.exit(shuttingDown ? 0 : 1);
      return; // unreachable
    }
    default:
      return error(req.id, -32601, `Method not found: ${req.method}`);
  }
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  let parsed: JsonRpcRequest | JsonRpcRequest[];
  try {
    parsed = JSON.parse(line);
  } catch (e) {
    return error(null, -32700, 'Parse error');
  }
  if (Array.isArray(parsed)) {
    // Batch not implemented for simplicity
    return error(null, -32600, 'Batch requests not supported');
  } else {
    handleRequest(parsed);
  }
});

process.on('SIGINT', () => {
  rl.close();
  process.exit(0);
});
