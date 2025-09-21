# Minimal MCP Server (Experimental)

このディレクトリは最小構成の MCP (Model Context Protocol) 互換 JSON-RPC サーバー例です。

## 特徴
- JSON-RPC 2.0 over stdio
- 実装メソッド: `initialize`, `ping`, `shutdown`, `exit`
- 未サポート: バッチリクエスト、拡張 tool 呼び出し、context streaming

## 使い方
```bash
cd mcp-server
npm install
npm run build
node dist/server.js &  # バックグラウンド起動例

echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientName":"manual"}}' | node dist/server.js
```

対話例 (単発):
```bash
# initialize
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node dist/server.js
# ping (初期化前はエラー)
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"ping"}' | node dist/server.js
```

## 開発 (ホット実行)
`ts-node/esm` ローダを使ってトランスパイルなしで実行:
```bash
npm run dev
```

## 将来拡張アイデア
- tools: `listTools` / `callTool` API 追加
- context: 周辺ソースコードスニペット提供
- エラーロギング & 構造化 JSON ログ
- Batch リクエスト対応

## 注意
このサーバーは概念実証目的であり、安定性や完全な MCP 仕様準拠は保証しません。
