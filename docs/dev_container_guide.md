# Dev Container ガイド

## 主要ファイル

- `.devcontainer/devcontainer.json` - Dev Container の設定。
- `.devcontainer/Dockerfile` - Container のベースイメージと必要なパッケージ。
- `.devcontainer/post-create.sh` - コンテナ作成後に anyenv と nodenv を `vscode` ユーザーのホームにインストールします。

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