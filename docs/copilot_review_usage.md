# Copilot レビュー活用手順

本書は `copilot_prompts.md` にあるプロンプト群の **具体的な使い方 (どこで・いつ・どう貼るか)** を示します。レビュー指摘は最終的に人間が責任を持って取捨選択してください。

---
## 1. 目的
- PR レビューの初期パスを高速化
- セキュリティ/性能/テスト抜けなど取りこぼし低減
- 指摘の日本語統一 (ナレッジ蓄積効率化)

---
## 2. 前提条件
| 項目 | 必須 / 任意 | 内容 |
|------|-------------|------|
| GitHub Copilot for PRs | 任意 (あれば便利) | PR 画面でのサイドパネル利用 |
| GitHub Copilot Chat (VS Code 拡張) | 任意 | ローカル差分で事前レビュー |
| `copilot_prompts.md` | 必須 | プロンプトソース |
| 日本語出力ラッパ | 必須 | 英語出力を防ぐ (`Always return ...`) |
| セルフレビュー | 必須 | Copilot 依存し過ぎない |

---
## 3. 利用シーン別の場所
| シーン | 利用 UI | 特徴 |
|--------|---------|------|
| 全体差分レビュー | GitHub PR ページの Copilot パネル | 手軽・その場反映 |
| 部分限定 (特定ディレクトリ) | 同上 + スコープ条件追記 | ノイズ削減 |
| ローカル開発中 | VS Code Copilot Chat | PR 作成前の改善 |
| 行/ファイル単位 | GitHub 差分画面の行アクション | ピンポイント検証 |

---
## 4. 基本フロー (標準)
1. ブランチ作業完了 → PR を **Draft** で作成
2. PR テンプレートのセルフチェックを埋める
3. 不要差分(フォーマット/未使用コード)除去 → コミット
4. Copilot へ初回プロンプト投入: 基本レビュー
5. 出力結果を精査し **重要な指摘のみ** 修正 or コメント化
6. 追加観点 (セキュリティ/テスト等) を二次プロンプトで補完
7. Ready for review → 人間レビュー依頼

---
## 5. 最小プロンプト例 (コピペ用)
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

---
## 6. スコープ絞り込み例
| 目的 | 追記する行 |
|------|------------|
| 特定ディレクトリ | `Focus only on files under src/core/.` |
| Markdown無視 | `Ignore *.md and docs/.` |
| 直近コミットのみ | `Consider only changes in the last 2 commits.` |
| 大量差分抑制 | `Limit analysis to at most 200 changed lines.` |

複合例:
```
Always return the final answer strictly in natural Japanese.
Review this pull request diff. Focus only on files under src/service/ and ignore *.md.
Return only [must], [sec], [perf] findings. Max 8 lines.
```

---
## 7. VS Code での使用手順
1. 最新 `main` を取り込み: `git fetch origin && git rebase origin/main`
2. ブランチを checkout 済で変更が残っている状態
3. Copilot Chat を開き `@git diff` などで差分を明示 (拡張機能がサポートしていれば)
4. プロンプト貼付 → 出力検証 → 必要なら即リファクタ
5. PR 作成後は GitHub 側で再度最終差分の確認

---
## 8. 行/ファイル単位アドホックレビュー
GitHub 差分行のアクション (Copilot アイコン) から短いプロンプト:
```
Always return the final answer strictly in natural Japanese.
Explain if this change introduces a performance regression. If safe, reply "[perf] 問題なし".
```

---
## 9. 指摘をコメント化する際の変換指針
| Copilot出力例 | コメント化時 | 備考 |
|---------------|--------------|------|
| 関数が長い → 分割推奨 | `[imo] getUserData関数は80行超。検証/永続化を分離可能` | WHY を短く明示 |
| バリデーション欠如 | `[must] userInput未検証。isValidUserInput() 追加し400返却で早期終了を推奨` | 修正案必須 |
| パフォーマンス懸念あいまい | (採用しない) | 根拠薄い指摘は捨てる |

---
## 10. よくある失敗と防止策
| 失敗 | 症状 | 対策文サンプル |
|------|------|---------------|
| ノイズ多すぎ | スタイル指摘多数 | `Avoid stylistic nitpicks.` をプロンプトに追加 |
| 英語混入 | 補助説明が英語 | 日本語ラッパを最上段・末尾に重ねる |
| 過剰指摘 | 30件以上羅列 | `Limit to top 10 findings.` |
| 関連性低 | vendor/lock 解析 | `Ignore vendor/, *.lock` |
| 既修正が再提示 | ループ | 再実行前に差分を再確認してから再実行 |

---
## 11. チートシート (抜粋)
| 目的 | キーワード | 追加すると良い行 |
|------|------------|------------------|
| セキュリティ集中 | security | `Act only as a security reviewer.` |
| テスト不足探索 | tests | `List missing test scenarios...` |
| 分割提案 | split | `Propose a logical split plan.` |
| CHANGELOG生成 | changelog | `Summarize ... for a CHANGELOG entry.` |
| ノイズ抑制 | limit | `Limit to top 8 findings.` |

---
## 12. 運用リズム (推奨)
| タイミング | アクション |
|------------|-----------|
| 実装完了直後 | VS Code で粗レビュー (性能/セキュリティ) |
| Draft PR 作成時 | 基本レビュー + テストギャップ |
| Ready 化前 | 指摘反映後再実行 (件数減確認) |
| レビュー中 | 局所的詳細 (行単位) プロンプト |

---
## 13. 判定の自動化補助
- 英語コメント検出 Action が PR 上で注意コメント投稿
- 今後の拡張候補: prefix 統計 / 翻訳提案 / セキュリティ高優先自動ラベル

---
## 14. FAQ
**Q. 英語でプロンプト書いてもいい?** → 問題ないが出力ラッパを必ず前置。  
**Q. 出力が冗長?** → 件数/文字数制限を後ろに追加。  
**Q. 既に直した指摘を再度出してくる?** → スコープ絞り or commit 範囲指定。  
**Q. プロンプト自体をテンプレ化したい?** → VS Code の Snippet or GitHub Gist を利用。  

---
## 15. 継続改善
改善案は `[docs]` タグで PR。利用ログから頻出パターンを吸い上げてプロンプト集へ反映してください。

---
以上。最小フロー: 「Draft PR → 基本プロンプト → 指摘取捨 → 集中プロンプト追撃 → Ready」。
