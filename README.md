# Node.js アプリ開発環境テンプレート

VS Code の Dev Container を使い、統一された開発環境を構築します。<br />
anyenv と nodenv で Node.js のバージョン管理を行えるように設定しています。

> ✅ 詳細手順 (Node バージョン指定 / nodenv 復旧 / フォールバックバージョン変更 など) は必ず [docs/dev_container_guide.md](docs/dev_container_guide.md) を参照してください。ここでは概要のみ記載します。

### 前提条件 (必須)
- VS Code 最新版 (安定版)
- 拡張: **Dev Containers** (`ms-vscode-remote.remote-containers`) ← 未インストールだとコンテナ起動オプションが表示されません

インストール確認手順:
1. VS Code 左サイドバー拡張 (`Extensions`) を開く
2. `Dev Containers` で検索しインストール (インストール済なら Skip)
3. コマンドパレットで `Dev Containers: Open Folder in Container...` が表示されることを確認

### セキュリティ関連の重要注意 (抜粋)
- Node バージョンは `.node-version` で固定し再現性を確保。更新時は LTS への追随方針を運用で決め、放置しない
- `anyenv` / `nodenv` の definitions 更新は `git pull` に依存するため Supply Chain リスク低減のため固定タグ/ハッシュ採用や定期見直しを推奨
- 追加パッケージ導入時は `npm audit` / GitHub Advisory を CI (将来) に組み込む余地あり

---


## 使い方（VS Code）

1. VS Code でこのフォルダを開く。
2. コマンドパレットで「Dev Containers: Reopen in Container」を選択。
    - バージョンの違いにより「Reopen in Container」と部分一致する表記になっている可能性があります。
    - または VS Code の左下にある接続先を押下すると「リモートウィンドウを開くオプションを選択します」と表示されるので、「コンテナーで再度開く」を選択。
3. コンテナが起動し、`.devcontainer/post-create.sh` が実行されて anyenv と nodenv がインストールされます。
4. 具体的な Node バージョン確認/変更/トラブル復旧は `docs/dev_container_guide.md` を参照。

より詳細なセットアップ/復旧/バージョン運用手順は [Dev Container ガイド](docs/dev_container_guide.md) を参照してください。

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
| レビュー観点ガイド | [docs/review_guide.md](docs/review_guide.md) | 観点網羅 & 重大度基準 |
| プロンプト集 | [docs/copilot_prompts.md](docs/copilot_prompts.md) | Copilot へ貼るプロンプトテンプレ |
| 利用手順 | [docs/copilot_review_usage.md](docs/copilot_review_usage.md) | 具体操作 (どこで/いつ/どう貼るか) |

### コメント接頭辞 (Prefix)
`[must]` (必須) / `[sec]` (セキュリティ) / `[perf]` (性能) / `[test]` (テスト) / `[docs]` (ドキュメント) / `[imo]` (任意改善) / `[nits]` (微細) / `[ask]` (質問) / `[fyi]` (参考)

### 推奨プロンプト最小形
```
Always return the final answer strictly in natural Japanese. Keep code identifiers and proper nouns in original language. Do not add extra English commentary.
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
1. Draft PR 作成
2. 上記プロンプトで初回自動レビュー → 有用な指摘を取捨選択
3. セキュリティ / テスト / 分割提案など追加プロンプトで深掘り
4. Ready 化 → 人間レビュー → `[must]` / `[sec]` 解消後マージ

### ベストプラクティス抜粋
- 出力は“下書き” と捉え鵜呑みにしない
- 冗長時: `Limit to top 8 findings.` を末尾追加
- スタイルノイズ抑制: `Avoid stylistic nitpicks.`
- スコープ絞り: `Focus only on files under src/...` / `Ignore *.md`

詳細は上記ドキュメントを参照。改善提案歓迎です。

---

## ドキュメント命名ポリシー
Markdown ドキュメントは以下を原則とします:
- ファイル名は基本的に **小文字 + アンダースコア** のみ (例: `copilot_prompts.md`)
- 必要がない限り大文字のファイル名は使わない
- 単語区切りにハイフンは使用しない (混在防止)
- 参照リンクは相対パスで小文字名に統一

理由: 一覧表示時の視認性/可読性向上、一貫したレビュー基準確立。

---

## 推奨 VS Code 拡張
以下は開発体験向上用です。Dev Containers 拡張のみ必須、他は任意です。Dev Container 起動時に自動インストール / 推奨表示されます。

| 拡張 | ID | 用途概要 |
|------|----|----------|
| Dev Containers (必須) | `ms-vscode-remote.remote-containers` | コンテナ開発環境統合操作 |
| GitHub Pull Requests | `github.vscode-pull-request-github` | PR レビュー / コメント連携 |
| GitLens | `eamodio.gitlens` | Git 履歴・責務トレース可視化 |
| ESLint | `dbaeumer.vscode-eslint` | Lint / 品質チェック |
| Prettier | `esbenp.prettier-vscode` | コード整形 |

`devcontainer.json` と `.vscode/extensions.json` にも反映済みです。
