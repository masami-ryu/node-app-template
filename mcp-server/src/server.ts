import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { Ajv, type AnySchema } from 'ajv';
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

// Ajv インスタンス (追加プロパティ禁止, allErrors で複数取得)
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
type ValidatorFn = (data: unknown) => boolean;
const compiledSchemas: Record<string, ValidatorFn> = {};

function getValidator(tool: ToolDescriptor) {
  if (!tool.inputSchema) return null;
  if (!compiledSchemas[tool.name]) {
  compiledSchemas[tool.name] = ajv.compile(tool.inputSchema as AnySchema) as ValidatorFn;
  }
  return compiledSchemas[tool.name];
}

function runTool(params: CallToolParams): { ok: true; result: CallToolResult } | { ok: false; code: number; message: string; data?: unknown } {
  const tool = tools.find(t => t.name === params.name);
  if (!tool) {
    return { ok: false, code: ERROR_CODES.UNKNOWN_TOOL, message: `Unknown tool: ${params.name}` };
  }
  const args = (params.arguments || {}) as Record<string, unknown>;
  const validator = getValidator(tool);
  if (validator) {
    const valid = validator(args);
    if (!valid) {
      return {
        ok: false,
        code: ERROR_CODES.INVALID_TOOL_ARGS,
        message: 'Invalid arguments',
        data: (validator as any).errors
      };
    }
  }
  // 文字列長安全ガード (text 最大 4KB)
  if ('text' in args && typeof args['text'] === 'string') {
    const text = args['text'] as string;
    if (text.length > 4096) {
      return { ok: false, code: ERROR_CODES.INVALID_TOOL_ARGS, message: 'text too long (>4096)' };
    }
  }
  try {
    switch (tool.name) {
      case 'echo':
        if (typeof args['text'] !== 'string') return { ok: false, code: ERROR_CODES.INVALID_TOOL_ARGS, message: 'text must be string' };
        return { ok: true, result: { name: 'echo', output: { text: args['text'] } } };
      case 'time':
        return { ok: true, result: { name: 'time', output: { epochMs: Date.now(), iso: new Date().toISOString() } } };
      case 'uppercase':
        if (typeof args['text'] !== 'string') return { ok: false, code: ERROR_CODES.INVALID_TOOL_ARGS, message: 'text must be string' };
        return { ok: true, result: { name: 'uppercase', output: { text: (args['text'] as string).toUpperCase() } } };
      default:
        return { ok: false, code: ERROR_CODES.TOOL_EXEC_ERROR, message: 'Tool not implemented' };
    }
  } catch (e) {
    return { ok: false, code: ERROR_CODES.TOOL_EXEC_ERROR, message: (e as Error).message };
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
      const exec = runTool(params);
      if (!exec.ok) return error(req.id, exec.code, exec.message, exec.data);
      return success(req.id, exec.result);
    }
    case 'shutdown': {
      shuttingDown = true;
      return success(req.id, {});
    }
    case 'exit': {
      // graceful: readline close -> 'close' 後に exit
      const code = shuttingDown ? 0 : 1;
      rl.close();
      setImmediate(() => process.exit(code));
      return;
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
    // Batch not implemented: JSON-RPC 2.0 では配列 -> Batch. 現行サーバー方針として非対応を明示
    // エラーコードは -32600 (Invalid Request) を採用しメッセージに非対応である旨を記述
    return error(null, -32600, 'Batch requests not supported (single request only)');
  } else {
    handleRequest(parsed);
  }
});

process.on('SIGINT', () => {
  rl.close();
  process.exit(0);
});
