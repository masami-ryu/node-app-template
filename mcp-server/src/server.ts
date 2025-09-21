import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  JsonRpcSuccess,
  InitializeParams,
  InitializeResult,
  ToolDescriptor,
  ListToolsResult,
  CallToolParams,
  CallToolResult,
  ERROR_CODES
} from './types.js';

const rl = createInterface({ input });

let initialized = false;
let shuttingDown = false;

// ---- Tool registry (シンプルなインメモリ) ----
const tools: ToolDescriptor[] = [
  {
    name: 'echo',
    description: '与えられた text をそのまま返す',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: '任意の文字列' } },
      required: ['text'],
      additionalProperties: false
    }
  },
  {
    name: 'time',
    description: '現在の Unix 時刻(ms)と ISO8601を返す',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'uppercase',
    description: 'text を大文字化して返す',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: '変換対象文字列' } },
      required: ['text'],
      additionalProperties: false
    }
  }
];

function runTool(params: CallToolParams): CallToolResult {
  const tool = tools.find(t => t.name === params.name);
  if (!tool) {
    return { name: params.name, error: 'Unknown tool' };
  }
  const args = params.arguments || {};
  // 簡易必須チェック
  if (tool.inputSchema?.required) {
    for (const r of tool.inputSchema.required) {
      if (!(r in args)) {
        return { name: tool.name, error: `Missing required argument: ${r}` };
      }
    }
  }
  try {
    switch (tool.name) {
      case 'echo':
        return { name: 'echo', output: { text: String(args['text']) } };
      case 'time':
        return { name: 'time', output: { epochMs: Date.now(), iso: new Date().toISOString() } };
      case 'uppercase':
        return { name: 'uppercase', output: { text: String(args['text']).toUpperCase() } };
      default:
        return { name: tool.name, error: 'Not implemented' };
    }
  } catch (e) {
    return { name: tool.name, error: (e as Error).message };
  }
}

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
        capabilities: { ping: true, tools: true }
      };
      initialized = true;
      return success(req.id, result);
    }
    case 'ping': {
      if (!initialized) return error(req.id, -32002, 'Server not initialized');
      return success(req.id, { pong: true, timestamp: Date.now() });
    }
    case 'listTools': {
      if (!initialized) return error(req.id, ERROR_CODES.NOT_INITIALIZED, 'Server not initialized');
      const result: ListToolsResult = { tools };
      return success(req.id, result);
    }
    case 'callTool': {
      if (!initialized) return error(req.id, ERROR_CODES.NOT_INITIALIZED, 'Server not initialized');
      const params = (req.params || {}) as CallToolParams;
      if (!params.name) return error(req.id, ERROR_CODES.INVALID_TOOL_ARGS, 'Missing tool name');
      const tool = tools.find(t => t.name === params.name);
      if (!tool) return error(req.id, ERROR_CODES.UNKNOWN_TOOL, `Unknown tool: ${params.name}`);
      const result = runTool(params);
      return success(req.id, result);
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
