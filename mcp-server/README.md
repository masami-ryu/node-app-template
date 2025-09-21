# Minimal MCP Server (Experimental)

このディレクトリは最小構成の MCP (Model Context Protocol) 互換 JSON-RPC サーバー例です。

## 特徴
- JSON-RPC 2.0 over stdio
- 実装メソッド: `initialize`, `ping`, `listTools`, `callTool`, `shutdown`, `exit`
- 最小の簡易 tools API (echo / time / uppercase)
- 未サポート: バッチリクエスト、context streaming、認証

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
# listTools
printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"listTools"}' | node dist/server.js
# callTool echo
printf '%s\n' '{"jsonrpc":"2.0","id":4,"method":"callTool","params":{"name":"echo","arguments":{"text":"hello"}}}' | node dist/server.js
```

## 開発 (ホット実行)
`ts-node/esm` ローダを使ってトランスパイルなしで実行:
```bash
npm run dev
```

## tools API 仕様 (暫定)
### listTools
Request:
```json
{"jsonrpc":"2.0","id":1,"method":"listTools"}
```
Response (例):
```json
{"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"echo","description":"与えられた text をそのまま返す"}]}}
```

### callTool
Request (echo):
```json
{"jsonrpc":"2.0","id":2,"method":"callTool","params":{"name":"echo","arguments":{"text":"hi"}}}
```
Response:
```json
{"jsonrpc":"2.0","id":2,"result":{"name":"echo","output":{"text":"hi"}}}
```

エラーコード (JSON-RPC error として返却):
- `-32010` 未初期化呼び出し
- `-32011` 不明ツール
- `-32012` 引数バリデーション失敗 (スキーマ/型/追加プロパティ・長さ超過)
- `-32013` ツール実行内部エラー

ポリシー:
- tools API での失敗は `result.error` ではなく JSON-RPC `error` で表現し統一
- Batch (配列) は未サポート: `-32600` (Invalid Request) + メッセージで非対応明示
- 入力文字列 `text` は最大 4096 文字に制限

## 将来拡張アイデア
- context: 周辺ソースコードスニペット提供
- エラーロギング & 構造化 JSON ログ
- Batch リクエスト対応
- tools 内でのストリーミング応答

## 注意
このサーバーは概念実証目的であり、安定性や完全な MCP 仕様準拠は保証しません。
