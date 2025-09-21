# Dev Container テンプレート (anyenv + nodenv)

このリポジトリは VS Code Dev Container テンプレートです。anyenv と nodenv を使って Node.js のバージョン管理を行えるように設定しています。

## 主要ファイル

- `.devcontainer/devcontainer.json` - Dev Container の設定。
- `.devcontainer/Dockerfile` - Container のベースイメージと必要なパッケージ。
- `.devcontainer/post-create.sh` - コンテナ作成後に anyenv と nodenv を `vscode` ユーザーのホームにインストールします。

## 使い方（VS Code）

1. VS Code でこのフォルダを開く。
2. コマンドパレットで「Remote-Containers: Reopen in Container」を選択。
3. コンテナが起動し、`.devcontainer/post-create.sh` が実行されて anyenv と nodenv がインストールされます。

## シェルで nodenv を使う

コンテナ内の新しいシェルを開くと、通常は `anyenv` と `nodenv` が有効になります。もし有効になっていない場合は、以下を実行してください。

```bash
export PATH="$HOME/.anyenv/bin:$HOME/.nodenv/bin:$PATH"
eval "$(anyenv init -)"
eval "$(nodenv init -)"
```

その後、Node のインストールとグローバル設定は次のようにします：

```bash
nodenv install --list
nodenv install 22.19.0
nodenv global 22.19.0
nodenv rehash
```

## Node バージョン指定方法

このテンプレートでは `.node-version` ファイルでプロジェクトの Node バージョンを明示します（例: `22.19.0`）。

`post-create.sh` は以下の順序でバージョンを解決します:

1. `.node-version`
2. `package.json` の `engines.node`（固定バージョンのみ推奨）
3. 何も指定が無い場合、スクリプト内の内部フォールバック (`DEFAULT_NODE_VERSION`, 現在は `22.19.0`)

フォールバックを変更したい場合: `.devcontainer/post-create.sh` 冒頭付近の `DEFAULT_NODE_VERSION` を編集、または `.node-version` を追加してください。フォールバックを無効化したい場合は空文字に設定します。

`.node-version` を更新したら、新しいシェルを開くか `nodenv rehash` を実行してください。

`engines.node` が semver 範囲 (例: `">=18"`, `^20`) の場合、node-build はそのままでは解釈できずインストールに失敗する可能性があります。具体的なバージョンを `.node-version` に記載するか、将来的に範囲解決ロジックを追加してください。

### インストール確認コマンド
```bash
export PATH="$HOME/.anyenv/bin:$PATH"
eval "$(anyenv init -)"
eval "$(nodenv init -)"  # nodenv が入っていれば
nodenv versions
node -v
```

### 失敗時の手動復旧例
```bash
export PATH="$HOME/.anyenv/bin:$PATH"
eval "$(anyenv init -)"
anyenv install nodenv   # 失敗する場合は definitions を更新: (cd ~/.config/anyenv/anyenv-install && git pull)
export PATH="$HOME/.nodenv/bin:$PATH"
eval "$(nodenv init -)"
nodenv install 22.19.0
nodenv global 22.19.0
nodenv rehash
```

## 補足

- 任意の Node バージョンを `.node-version` で管理することを推奨します（`package.json` の `engines.node` は補助的用途）。
- コンテナイメージは `mcr.microsoft.com/vscode/devcontainers/base:ubuntu` ベースです。別のベースを希望する場合は `Dockerfile` を編集してください。
 - anyenv definitions は対話プロンプトを避けるため `anyenv install --init` ではなく直接 `git clone --depth 1` で取得し、既存があれば `fetch + reset` で更新します。`~/.config/anyenv/anyenv-install` が壊れた場合は削除後コンテナ再起動、または手動 clone で復旧可能です。

---

何か追加したい設定（例: yarn, pnpm, yarn2, global npm packages）があれば教えてください。

---

## レビュー運用 (GitHub Copilot 活用方針)

このリポジトリでは Pull Request レビュー効率化と品質確保のため Copilot を以下の方針で利用します。

### 目的
- 初期レビュー (粗スクリーニング) を高速化
- セキュリティ / パフォーマンス / テスト抜けの取りこぼし低減
- コメント言語の日本語統一によるナレッジ蓄積性向上

### 中核ドキュメント
| 項目 | 位置 | 用途 |
|------|------|------|
| レビュー観点ガイド | `.github/REVIEW_GUIDE.md` | 観点網羅 & 重大度基準 |
| プロンプト集 | `docs/COPILOT_PROMPTS.md` | Copilot へ貼るプロンプトテンプレ |
| 利用手順 | `docs/COPILOT_REVIEW_USAGE.md` | 具体操作 (どこで/いつ/どう貼るか) |

### コメント接頭辞 (Prefix)
`[must]` (必須) / `[sec]` (セキュリティ) / `[perf]` (性能) / `[test]` (テスト) / `[docs]` (ドキュメント) / `[imo]` (任意改善) / `[nits]` (微細) / `[ask]` (質問) / `[fyi]` (参考)

### 推奨プロンプト最小形
```
Always return the final answer strictly in natural Japanese.
You are a senior software engineer. Review this pull request diff.
Tasks:
1. List high severity issues with prefix [must].
2. List potential security concerns with prefix [sec].
3. List performance risks with prefix [perf].
4. Suggest test gaps with prefix [test].
Return sections: MUST, SECURITY, PERFORMANCE, TESTS, OTHERS.
Limit to top 12 findings.
```

### 運用フロー (概要)
1. Draft PR 作成 & テンプレセルフチェック
2. 上記プロンプトで初回自動レビュー → 有用な指摘を取捨選択
3. セキュリティ / テスト / 分割提案など追加プロンプトで深掘り
4. Ready 化 → 人間レビュー → `[must]` / `[sec]` 解消後マージ

### 自動化
- 英語コメント検出: `.github/workflows/enforce-japanese-copilot-comments.yml` が英語主体の Copilot コメントを検出し注意

### ベストプラクティス抜粋
- 出力は“下書き” と捉え鵜呑みにしない
- 冗長時: `Limit to top 8 findings.` を末尾追加
- スタイルノイズ抑制: `Avoid stylistic nitpicks.`
- スコープ絞り: `Focus only on files under src/...` / `Ignore *.md`

詳細は上記ドキュメントを参照。改善提案歓迎です。
