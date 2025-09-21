export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: number | string | null;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export interface InitializeParams {
  clientName?: string;
  capabilities?: Record<string, unknown>;
}

export interface InitializeResult {
  serverName: string;
  capabilities: {
    ping: boolean;
    tools?: boolean;
  };
}

// ---- Tools API Types ----
export interface ToolDescriptor {
  name: string;            // ツール内部名 (callTool で指定)
  description: string;     // 簡潔な説明
  inputSchema?: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface ListToolsResult {
  tools: ToolDescriptor[];
}

export interface CallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface CallToolResult {
  name: string;
  output?: unknown;         // 正常時の出力
  error?: string;           // ツール内部エラー(サーバーは JSON-RPC エラーコードではなく content に格納)
}

// 追加エラーコード(暫定):
// -32010: 未初期化での tools API 呼び出し
// -32011: 不明なツール
// -32012: ツール引数バリデーション失敗
export const ERROR_CODES = {
  NOT_INITIALIZED: -32010,
  UNKNOWN_TOOL: -32011,
  INVALID_TOOL_ARGS: -32012,
  TOOL_EXEC_ERROR: -32013
} as const;

