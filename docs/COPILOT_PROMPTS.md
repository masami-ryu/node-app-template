# GitHub Copilot レビュー用プロンプト集

> 具体的な操作手順は `./COPILOT_REVIEW_USAGE.md` を参照してください。

Pull Request 上で Copilot Chat / Reviews に貼り付けて自動レビューを促進するためのプロンプト例集です。プロンプト入力は英語主体ですが、最終出力は常に **自然な日本語** に統一してください。

---
## 日本語出力ラッパ (必ず先頭に付与推奨)
以下の 1 行 (または類似表現) を任意プロンプトの先頭に付けることで、Copilot 出力を日本語へ強制できます。
```
Always return the final answer strictly in natural Japanese. Keep code identifiers and proper nouns in original language. Do not add extra English commentary.
```

---
## 使用方法
1. PR を Draft で作成し、セルフチェック完了後 Ready に変更
2. 下記から目的に合うプロンプトを選び Copilot Chat に貼り付け
3. 返答のうち有益な内容を人間レビューと統合
4. 重複・誤検出は `[imo]` / `[nits]` として調整

---
## 基本 (差分全体レビュー)
```
Always return the final answer strictly in natural Japanese. Keep code identifiers and proper nouns in original language.
You are a senior software engineer. Review this pull request diff.
Tasks:
1. List high severity issues with prefix [must].
2. List potential security concerns with prefix [sec].
3. List performance risks with prefix [perf].
4. Suggest test gaps with prefix [test].
5. Use concise bullet points, one issue per line. Avoid style nitpicks.
Return sections in this order: MUST, SECURITY, PERFORMANCE, TESTS, OTHERS.
```

## 変更概要の要約生成
```
Always return the final answer in natural Japanese.
Summarize this pull request for a CHANGELOG entry.
Include: problem, solution approach, notable risks, migration needs.
Output in Japanese, 5 bullet points max.
```

## セキュリティ特化
```
Always return the final answer in natural Japanese.
Act as an application security reviewer.
Scan the PR diff for:
- missing input validation
- injection risks (SQL/command/template)
- hard-coded secrets
- improper authZ/authN checks
- unsafe crypto usage
Output each as a bullet starting with [sec]. If none, say 'No critical security risks detected.'
```

## パフォーマンス特化
```
Always return the final answer in natural Japanese.
Identify potential performance issues in the PR diff.
Focus on: N+1 queries, redundant loops, large object allocations, synchronous blocking I/O in hot paths.
Prefix each finding with [perf]. Provide a concrete improvement suggestion.
```

## テストギャップ特化
```
Always return the final answer in natural Japanese.
Check the PR diff and list missing or weak tests.
Classify with [test] and specify the scenario name.
Categories: boundary conditions, error handling, concurrency, large input, regression.
Return a markdown checklist.
```

## リファクタ提案
```
Always return the final answer in natural Japanese.
Suggest refactoring opportunities in the diff.
Rules: do NOT reformat code style, focus on logic simplification, duplication removal, better naming, function extraction (>40 lines or >3 nested levels).
Prefix each with [imo].
```

## リスク & ロールバック評価
```
Always return the final answer in natural Japanese.
From the PR diff, identify deployment risks and rollback considerations.
Return sections: RISKS, ROLLBACK_STRATEGY, MONITORING_METRICS.
If database or schema changes detected, highlight irreversible steps with [must].
```

## ログ・監視改善
```
Always return the final answer in natural Japanese.
Review changes for observability gaps.
Suggest missing logs (level + message focus), metrics, and traces.
Prefix required production visibility gaps with [must], suggestions with [imo].
```

## 依存関係追加チェック
```
Always return the final answer in natural Japanese.
Look for new dependencies added or version upgrades.
Assess for: unnecessary bloat, known security risk categories, duplication of existing functionality.
Prefix concerns with [must] or [sec] as appropriate.
```

## Diff ノイズ削減提案
```
Always return the final answer in natural Japanese.
Identify noisy or unrelated changes (format-only, commented-out code, unused variable removal) that could be split into a separate PR.
List them with [nits].
```

## 既存ガイド整合性チェック
```
Always return the final answer in natural Japanese.
Compare the PR against our review guide categories (design, readability, error handling, security, performance, tests, docs, observability, dependencies, risk/rollback).
Output a markdown table: Category | Status (OK / Review) | Note.
Only mark 'Review' where specific actionable feedback exists.
```

## 大規模PR分割提案
```
Always return the final answer in natural Japanese.
Assume this PR feels large or multi-purpose.
Propose a logical split plan (2-5 smaller PRs).
For each part: Name, Scope, Dependencies, Risk Level.
```

## 英語→日本語要約
```
Always return the final answer in natural Japanese.
Summarize the key code review issues (prefixed) into Japanese concise bullet points.
Group by prefix importance order: [must], [sec], [perf], [test], others.
```

---
## カスタマイズガイドライン
- プロンプトは "You are ..." で役割を明示すると精度↑
- 出力フォーマット (sections / table / checklist) を具体化
- ノイズ削減: "Ignore code style / formatting differences" を追加可
- 長大 PR の場合は範囲指定: "Focus on files under src/service/" など

## よくある失敗と対策
| 問題 | 対策例 |
|------|--------|
| 過度なnits指摘 | "Avoid stylistic nitpicks" を含める |
| 要点が散漫 | セクション順序を明示 |
| 冗長出力 | 最大件数 / 文字数制限指定 |
| 不正確なセキュリティ指摘 | "Only flag realistically exploitable issues" を追加 |

---
改善提案歓迎: このファイルに対する更新PRでは `[docs]` プレフィックスを付けてください。
