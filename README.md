# Salesforce E2E Test

Playwright を使用した Salesforce の E2E テストプロジェクトです。

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルをプロジェクトルートに作成し、以下の情報を設定してください：

```bash
SALESFORCE_USERNAME=your-username@example.com
SALESFORCE_PASSWORD=your-password
SALESFORCE_TOKEN=your-security-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com
```

#### 環境変数の説明

| 環境変数 | 説明 | 必須 |
|---------|------|------|
| `SALESFORCE_USERNAME` | Salesforceのユーザー名 | ✓ |
| `SALESFORCE_PASSWORD` | Salesforceのパスワード | ✓ |
| `SALESFORCE_TOKEN` | Salesforceのセキュリティトークン | ✓ |
| `SALESFORCE_LOGIN_URL` | SalesforceのログインURL（本番: `https://login.salesforce.com` / Sandbox: `https://test.salesforce.com`） | ✓ |

#### セキュリティトークンの取得方法

セキュリティトークンは、IPアドレス制限がある環境や、APIアクセス時に必要です。

1. Salesforceにログイン
2. 右上のユーザーアイコン → **設定** をクリック
3. 左サイドバーで **私のセキュリティトークンのリセット** を検索
4. **セキュリティトークンのリセット** ボタンをクリック
5. メールで新しいセキュリティトークンが送信されます
6. `.env` ファイルの `SALESFORCE_TOKEN` に設定

#### （オプション）接続アプリケーション（Connected App）を使用した認証

より安全な認証方法として、Salesforceの接続アプリケーションを使用したOAuth 2.0認証も可能です。

**接続アプリケーションの作成手順:**

1. Salesforceにログイン
2. **設定** → **アプリケーション** → **アプリケーションマネージャー** に移動
3. **新規接続アプリケーション** をクリック
4. 以下の情報を入力：
   - **接続アプリケーション名**: `Playwright E2E Test` (任意)
   - **API 名**: `Playwright_E2E_Test`
   - **連絡先メール**: あなたのメールアドレス
5. **API (OAuth 設定の有効化)** セクション:
   - **OAuth 設定の有効化** にチェック
   - **コールバック URL**: `http://localhost:3000/callback` (任意)
   - **選択した OAuth 範囲**:
     - `Full access (full)`
     - `Perform requests at any time (refresh_token, offline_access)`
6. **保存** をクリック
7. **コンシューマ鍵** と **コンシューマの秘密** をメモ

**接続アプリケーションを使用する場合の環境変数:**

```bash
SALESFORCE_USERNAME=your-username@example.com
SALESFORCE_PASSWORD=your-password
SALESFORCE_TOKEN=your-security-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com
# オプション: 接続アプリケーションを使用する場合
SALESFORCE_CLIENT_ID=your-consumer-key
SALESFORCE_CLIENT_SECRET=your-consumer-secret
```

> **注意**: 現在のプロジェクトではUsername-Passwordフロー（jsforce）を使用しているため、接続アプリケーションは必須ではありません。ただし、より安全な認証が必要な場合は、コードの修正が必要です。

## テストの作成

### Codegen を使ったテストコードの自動生成

Playwright Codegen を使用すると、ブラウザを操作しながら自動的にテストコードを生成できます。

#### 基本的な使い方

```bash
# 基本的な使い方
npx playwright codegen

# 特定のURLから開始
npx playwright codegen https://your-salesforce-instance.lightning.force.com

# 特定のブラウザで実行
npx playwright codegen --browser=chromium
```

#### Salesforce でのCodegen推奨手順

Salesforce のような認証が必要なアプリケーションの場合は、以下の手順でCodegenを使用します：

**Step 1: 認証状態を保存**
```bash
npx playwright codegen --save-storage=salesforce-auth.json https://your-salesforce-instance.lightning.force.com
```
- ブラウザが開いたらログイン
- ログイン後、ウィンドウを閉じる

**Step 2: 保存した認証状態を使ってCodegenを実行**
```bash
npx playwright codegen --load-storage=salesforce-auth.json https://your-salesforce-instance.lightning.force.com/lightning/o/Account/home
```
- 既にログイン済みの状態で開始されます
- 取引先タブなどで操作を記録

**Step 3: ブラウザで操作を実行**
- 「新規」ボタンをクリック
- フォームに入力
- 保存ボタンをクリック
- など、テストしたい操作を実行

**Step 4: 生成されたコードをコピー**
- Codegen Inspector に生成されたコードが表示されます
- コードをコピーして `tests/test.spec.ts` に貼り付け

#### その他の便利なCodegenオプション

```bash
# デバイスエミュレーション（モバイル表示など）
npx playwright codegen --device="iPhone 13" https://example.com

# タイムアウトを設定
npx playwright codegen --timeout=60000 https://example.com
```

### 手動でテストを作成

`tests/` ディレクトリ配下に `.spec.ts` ファイルを作成し、テストコードを記述します。
既存の `tests/test.spec.ts` を参考にしてください。

## テストの実行

### 基本的な実行方法

```bash
# ヘッドレスモードで実行（デフォルト）
npx playwright test

# ヘッドフルモード（ブラウザを表示）で実行
HEADLESS=false npx playwright test

# 特定のテストファイルを実行
npx playwright test tests/test.spec.ts

# ヘッドフルモードで特定のテストを実行
HEADLESS=false npx playwright test tests/test.spec.ts
```

### デバッグモード

```bash
# デバッグモードで実行（ステップ実行が可能）
npx playwright test --debug

# 特定のテストをデバッグ
npx playwright test tests/test.spec.ts --debug
```

## テスト結果の確認

### HTMLレポートの表示
テスト実行後、以下のコマンドでHTMLレポートを開くことができます：
```bash
npx playwright show-report
```

### スクリーンショットの確認
テスト実行中に撮影されたスクリーンショットは以下の場所に保存されます：
- `test-results/screenshots/` - テストコード内で明示的に撮影したスクリーンショット
- `test-results/` - Playwrightが自動的に撮影したスクリーンショット（各テストステップごと）

### ビデオの確認
テストが失敗した場合、`test-results/` ディレクトリにビデオが保存されます。

## プロジェクト構成

```
.
├── playwright.config.ts       # Playwright設定ファイル
├── tests/
│   ├── setup/
│   │   └── globalSetup.ts    # グローバルセットアップ（認証処理）
│   └── test.spec.ts          # テストファイル
├── playwright/
│   └── .auth/
│       └── user.json         # 認証情報（自動生成）
└── test-results/             # テスト結果、スクリーンショット、ビデオ
```

## 認証について

- 初回実行時に `globalSetup.ts` が実行され、Salesforce にログインして認証情報が `playwright/.auth/user.json` に保存されます
- 2回目以降のテストでは、保存された認証情報を使用するため、ログイン処理をスキップできます
- 認証情報をクリアしたい場合は、`playwright/.auth/user.json` を削除してください

## Tips

- `HEADLESS` 環境変数を設定することで、ヘッドレス/ヘッドフルモードを切り替えることができます
- テスト実行時に自動的にスクリーンショットが撮影され、HTMLレポートで確認できます
- Codegen で生成されたコードは、そのまま使えますが、適宜調整することをおすすめします
  - タイムアウト値の調整
  - セレクタの改善
  - アサーションの追加
  - コメントの追加
