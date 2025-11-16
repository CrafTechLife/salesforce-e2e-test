Salesforce E2Eテスト導入ガイド：PlaywrightによるMFA回避と堅牢な自動化戦略 (2025年版)I. 【最重要】Salesforce自動テストのためのログイン戦略：MFA/2FAの完全回避E2E (End-to-End) テストの信頼性は、ログイン処理の安定性、すなわち100%の成功率に依存します。Salesforceがログイン時に表示する「ID を検証」ページは、ブラウザやIPアドレスが「信頼されていない」と判断された場合に発生する、Multi-Factor Authentication (MFA) または2-Factor Authentication (2FA) の一環です 。自動テストは、実行のたびにクリーンなブラウザ環境で起動されるため、Salesforceからは毎回「新しいデバイス」として認識されます。これにより認証ページが表示され、テストは即座にブロックされます。したがって、最初の、そして最大の課題は、この検証プロセスを自動化の文脈で、合法的かつ安定的にバイパスすることです 2。このセクションでは、この認証課題を解決するための3つの主要な戦略を、アーキテクチャの観点から推奨度と共に詳述します。1.1. 戦略1 (基本/推奨): Salesforce側のIP許可設定これは、Salesforceのセキュリティ設定を活用する最も直接的なアプローチです。Salesforce組織に対し、「特定のIPアドレスからのアクセスは信頼できる」と設定することで、検証プロンプトの発生を抑制します 3。1.1.1. 組織レベル: 「ネットワークアクセス」の設定この方法は、組織全体で信頼できるIPアドレスの範囲を定義します。この範囲に含まれるIPアドレスからのログインは、ID検証プロンプトのトリガーになりにくくなります 2。ステップバイステップでの設定手順:Salesforceの「設定」 (Setup) に移動します。左側の「クイック検索」ボックスに ネットワークアクセス (Network Access) と入力し、同名のメニューを選択します 2。「新規」 (New) ボタンをクリックします 2。開始IPアドレス (Start IP Address) と 終了IPアドレス (End IP Address) を入力します。ローカルマシンでのテスト実行: ローカル環境でテストを実行する場合、まず自身のグローバルIPアドレスを知る必要があります。ターミナル（macOS/Linux）またはPowerShell（Windows）で curl ifconfig.me を実行し、表示されたIPアドレスを「開始」と「終了」の両方のフィールドに入力します 3。単一IPの指定: 単一のIPアドレスのみを許可する場合、開始と終了に同じアドレスを入力します 2。重要な留意点:Salesforceのドキュメント 2 によれば、この設定は検証プロンプトの頻度を「大幅に削減」するものの、組織のタイプや設定されている信頼済みIPの総数によっては、依然としてID検証を求められる可能性があると警告されています。1.1.2. プロファイルレベル: 「ログインIPアドレスの範囲」この方法は、特定のプロファイル（例: 自動テスト専用のユーザープロファイル）がログインできるIPアドレスを「制限」する、より厳格なアプローチです 5。ステップバイステップでの設定手順:「設定」から「プロファイル」 (Profiles) を検索し、自動テストで使用するユーザーが割り当てられているプロファイル（例: 「システム管理者」またはカスタムテストプロファイル）を選択します 5。プロファイルの詳細ページをスクロールし、「ログインIPアドレスの範囲」 (Login IP Ranges) セクションを見つけます。「新規」 (New) をクリックし、テスト実行マシンのIPアドレス範囲を追加します。アーキテクチャ上の使い分け:ネットワークアクセス (1.1.1): 「このIPは信頼できる」とSalesforceに通知し、検証をスキップさせたい場合に適しています。プロファイルレベル (1.1.2): 「このIP以外からのログインを拒否する」という、より厳格なセキュリティ統制です。推奨: 我々の目的（検証のスキップ）には、1.1.1. ネットワークアクセス がより適切です。（非推奨な）最後の手段:プロファイルレベルの設定で、IP範囲を 0.0.0.0 から 255.255.255.255 に設定する方法があります 5。これは事実上、IPベースの検証を無効化するため、テストは容易になりますが、深刻なセキュリティリスクを招きます。本番環境や重要なデータを持つSandboxでの使用は絶対に避け、完全に隔離されたDeveloper Edition環境でのみ検討してください。1.1.3. CI/CD環境（GitHub Actions等）における動的IPへの対処法（上級）ローカルマシン（IPアドレスが固定的または準固定的）でのIP許可は簡単です。しかし、将来的にCI/CD (Continuous Integration/Continuous Delivery) パイプライン（例: GitHub Actions, Jenkins, GitLab CI）でE2Eテストを自動実行する場合、真の課題に直面します 6。課題: CI/CDパイプラインでテストを実行する「ランナー」と呼ばれる仮想マシンは、多くの場合、実行ごとに異なる動的なIPアドレスを持ちます 8。アーキテクチャ上の影響: IPアドレスが毎回変わるため、戦略1（IP許可設定）はCI/CD環境においてほぼ無力化されます。解決策:静的IPを持つランナーの使用 (推奨):GitHub Actionsを使用する場合、デフォルトのランナーではなく、セルフホストランナー (Self-hosted runners) 10 を使用します。これを自社のクラウドインフラ（AWS, GCP, Azure）に構築し、静的なIPアドレスを割り当てます。または、GitHub-hostedのLarger runners 10 を利用します。これらは静的なIPアドレス範囲を提供する場合があり、そのIPレンジをSalesforceの「ネットワークアクセス」に登録します。動的IPの許可 (非推奨):CI/CDジョブの開始時に、スクリプト（例: curl ifconfig.me）で現在のランナーのIPを取得し 12、SalesforceのAPI（Metadata APIやTooling API）を呼び出して「ネットワークアクセス」設定を動的に更新する方法も理論上は可能です 9。しかし、このアプローチは非常に複雑であり、Salesforce自体がIP許可リストの頻繁な更新（接続中断の可能性があるため）を推奨していません 8。結論: CI/CDパイプラインでの安定稼働を見据える場合、戦略1は静的IPアドレスの確保が前提条件となります。1.2. 戦略2 (ローカル/非推奨): storageStateによるセッションの保存と再利用このアプローチは、Playwrightの強力なセッション保存機能を利用するものです。1.2.1. global-setup.tsによる認証セッションの生成概要: 「一度だけ」人間が（またはIP許可された環境で）UI経由でログイン操作を行い、そのセッション情報（Cookie、LocalStorageなど）をJSONファイル（storageState）として保存します 13。global-setup.ts (セッション生成用コード):TypeScript// global-setup.ts
import { test as setup, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

//.envファイルから環境変数を読み込む
dotenv.config();

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // このセットアップは、IP許可された環境で実行するか、
  // 開発者が手動でMFAを入力することを前提としています。
  await page.goto(process.env.SF_LOGIN_URL!);
  await page.getByLabel('Username').fill(process.env.SF_USERNAME!);
  await page.getByLabel('Password').fill(process.env.SF_PASSWORD!);
  await page.getByRole('button', { name: 'Log In' }).click();

  // ★★重要★★
  // ここで「IDを検証」ページが表示される場合、
  // 開発者が手動で認証コードを入力し、ログインを完了させる必要があります。
  // ログイン後のホーム画面（例：「App Launcher」アイコン）が表示されるまで待機
  console.log('Please complete MFA manually if prompted...');
  await expect(page.getByRole('button', { name: 'App Launcher' }))
   .toBeVisible({ timeout: 120000 }); // 2分間の手動操作マージン

  console.log('Login successful, saving storage state...');

  // 認証情報をファイルに保存
  await page.context().storageState({ path: authFile });
  console.log(`Storage state saved to ${authFile}`);
});
実行方法:ターミナルで npx playwright test --setup を一度だけ実行します。これにより global-setup.ts のみが実行され、playwright/.auth/user.json ファイルが生成されます。1.2.2. playwright.config.tsでのstorageStateの適用概要: Playwrightの設定ファイルで、すべてのテストが、先ほど保存されたセッション（user.json）を自動的に使用するように設定します 16。playwright.config.ts (抜粋):TypeScript// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  //... 他の設定...
  use: {
    baseURL: process.env.SF_BASE_URL, // 例: https://your-domain.lightning.force.com

    // グローバルにstorageStateを設定
    // これにより、全テストが 'user.json' のセッションで開始される
    storageState: 'playwright/.auth/user.json',
  },

  projects: [
    // global-setup.ts を実行するためのプロジェクト [13, 17]
    {
      name: 'setup',
      testMatch: '**/global-setup.ts'
    },

    // 実際のテストプロジェクト
    {
      name: 'chromium',
      use: {
        storageState: 'playwright/.auth/user.json'
      },
      // setupプロジェクトに依存させる
      dependencies: ['setup'],
    },
  ],
});
1.2.3. このアプローチの利点と重大な欠点利点: テスト実行が非常に高速です。各テストの前にUIログイン操作（ページの読み込み、入力、クリック）を完全にスキップできるためです。重大な欠点 (CI/CDの障害):セッションの失効: Salesforceのセッションは永久ではありません 17。user.json に保存されたセッションが失効すると、すべてのテストが認証エラーで失敗します。手動介入の必要性: CI/CD環境でセッションが失効した場合、パイプラインは停止します。解決するには、開発者がローカルで再度 npx playwright test --setup を実行し、MFAを手動で突破し、更新された user.json をリポジトリにコミットし直す必要があります。これは「自動化」の原則に反します。並列実行の競合: 複数のテストワーカーが同じ user.json（＝同一ユーザーの同一セッション）を共有すると、テスト間の競合が発生する可能性があります 17。例えば、あるテストが特定のデータを変更または削除し、同時に実行されている別のテストがそのデータに依存している場合、予期せぬ失敗を引き起こします。結論: 戦略2は、ローカル環境での一時的な開発やデバッグには便利ですが、CI/CDパイプラインで運用する信頼性の高い自動化戦略としては不適切です。1.3. 戦略3 (上級/最速/CI/CD最適): APIによる動的セッションIDの取得とCookieインジェクションこれは、シニアアーキテクトとして最も強く推奨する「真の」ベストプラクティスです。この戦略では、UIログイン（login.salesforce.com）を完全に排除し、API経由で認証を完了させます。アーキテクチャ概要:テスト実行の前（global-setup.ts 内）に、SalesforceのOAuth 2.0 API（JWT Bearer Flow 18 または Username-Password Flow 20）を直接呼び出します。これにより、UIを一切介さずに、有効なアクセストークン（Session ID）を動的に取得します。Playwrightでブラウザコンテキストを起動し、この取得したSession IDを sid という名前のCookieとして手動で「インジェクション（注入）」します 21。この「API経由でログイン済み」のコンテキスト状態を、storageStateファイル（例: user.json）として保存します。以降の全テストは、この動的に生成された user.json を使用して、既にログイン済みの状態から開始されます。利点:MFA/2FAの完全回避: UIログインページに一切アクセスしないため、「IDを検証」ページは100%表示されません。高速: ログイン処理がUI操作（数秒〜数十秒）からAPIコール（通常1〜2秒）に置き換わるため、テスト全体の実行時間が大幅に短縮されます。CI/CDに最適: 認証情報はすべて環境変数（.env）で管理されます。テスト実行のたびに常に新しいセッションが動的に生成されるため、戦略2の「セッション失効」の問題が根本的に解決されます。1.3.1. Salesforce側の準備: 「接続アプリケーション」の設定この戦略を実行するには、Salesforce側で「接続アプリケーション (Connected App)」を一度だけ設定し、APIアクセス（OAuth）を許可する必要があります。（Salesforce開発者であれば「接続アプリケーション」の設定はご存知かと思いますので、詳細な手順は割愛します）「OAuth 2.0 ユーザ名パスワードフロー」 20 を有効にするか、よりセキュアな「OAuth 2.0 JWT Bearer Flow」 18 を設定してください。この設定により、クライアントID (Consumer Key / CLIENT_ID) と クライアントシークレット (Consumer Secret / CLIENT_SECRET) が発行されます。これらを .env ファイルに保存します。1.3.2. global-setup.ts (APIログイン + Cookieインジェクション + storageState保存)この実装には、Salesforce APIをNode.jsから簡単に扱うための jsforce ライブラリ 23 を使用するのが最も効率的です。準備: npm install jsforce dotenv を実行してください。TypeScript// global-setup.ts (戦略3: APIログイン版)
import { chromium, FullConfig } from '@playwright/test';
import * as jsforce from 'jsforce';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

//.env から環境変数を読み込み
dotenv.config();

const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');

// 保存先ディレクトリが存在しない場合は作成
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

async function globalSetup(config: FullConfig) {
  console.log('Starting Global Setup: API Authentication...');

  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL!,
    // ユーザ名パスワードフローの場合、clientId/clientSecret が必要
    clientId: process.env.SF_CLIENT_ID!,
    clientSecret: process.env.SF_CLIENT_SECRET!,
  });

  const username = process.env.SF_USERNAME!;
  // パスワード + セキュリティトークン
  const password = process.env.SF_PASSWORD!;

  try {
    // OAuth 2.0 ユーザ名パスワードフロー  でログイン
    // (よりセキュアなJWT Bearer Flow  の使用を強く推奨)
    await conn.login(username, password, (err, userInfo) => {
      if (err) {
        console.error('JSforce login error:', err);
        throw new Error(`JSforce login failed: ${err.message}`);
      }
      console.log('JSforce login successful. User ID:', userInfo.id);
    });

    // 戦略3の核心: APIからセッションIDとインスタンスURLを取得
    const sessionId = conn.accessToken;
    const instanceUrl = conn.instanceUrl;

    if (!sessionId ||!instanceUrl) {
      throw new Error('Failed to retrieve Session ID or Instance URL from JSforce.');
    }

    console.log(`Retrieved Session ID. Instance URL: ${instanceUrl}`);

    // Playwrightブラウザを起動し、Cookieを注入する
    const browser = await chromium.launch();
    const context = await browser.newContext();

    // 核心部: セッションIDを 'sid' Cookieとしてコンテキストに設定
    const domain = new URL(instanceUrl).hostname; // 例: 'your-domain.lightning.force.com'

    console.log(`Injecting 'sid' cookie for domain: ${domain}`);

    await context.addCookies([
      {
        name: 'sid', // 'sid'がセッションCookieのキー [21, 52]
        value: sessionId,
        domain: domain,
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ]);

    // （オプションだが推奨）一度ページにアクセスし、他の必要なCookieやLocalStorageを初期化
    const page = await context.newPage();
    await page.goto(instanceUrl, { waitUntil: 'networkidle' });

    // App Launcherが表示され、ログインが成功していることを確認
    await page.getByRole('button', { name: 'App Launcher' }).waitFor({ timeout: 60000 });
    console.log('Cookie injection successful, page loaded.');

    // この「API経由でログイン済み」のコンテキスト状態を保存
    await context.storageState({ path: authFile });
    console.log(`API-authenticated storage state saved to ${authFile}`);

    await browser.close();

    // 他のテストで使用するために、設定をグローバルにエクスポート (V. で利用)
    process.env.SF_INSTANCE_URL = instanceUrl;
    process.env.SF_SESSION_ID = sessionId;

  } catch (error) {
    console.error('FATAL Error during global-setup (API Login):', error);
    process.exit(1); // セットアップ失敗時はテスト実行を中止
  }
}

export default globalSetup;
playwright.config.ts側では、この globalSetup を参照し 17、use: { storageState: authFile } 17 を設定します（1.2.2のコードと同様ですが、dependencies の設定がより重要になります）。1.4. ログイン戦略の比較と最終推奨3つの戦略のトレードオフを、以下の表にまとめます。Table 1: Salesforce自動ログイン戦略の比較戦略アプローチ設定の複雑さ実行速度 (ログイン)信頼性 (MFA回避)CI/CDへの適性戦略1IP許可 + UIログイン中 (Salesforce設定 + 静的IP確保 10 が課題)遅い (UI操作)中 (Salesforce側の警告あり 2)中 (静的IPが必須)戦略2手動 storageState低 (手動生成)最速 (UI操作なし)高 (セッション有効時)不可 (失効時に手動介入が必要 17)戦略3API + Cookieインジェクション高 (初回に接続App設定が必要 20)最速 (APIコールのみ)100% (UIに非依存)最適 (動的, ヘッドレス, 高信頼)アーキテクトとしての最終推奨:短期的・ローカルでの検証: まずは**戦略1（IP許可）**を試すのが手軽です。これはユーザーからのリクエストにも合致しています。長期的・CI/CDでの運用: Salesforce開発者として、DevOpsパイプライン 6 での安定稼働を最終ゴールと据えるならば、初期投資を払ってでも**戦略3（API + Cookieインジェクション）**を導入することを強く推奨します。これが2025年11月現在における、最も堅牢かつ保守性の高いベストプラクティスです。II. Salesforce E2EテストのためのPlaywrightセットアップログイン戦略の目処が立ったところで、PlaywrightプロジェクトをSalesforceテスト用に最適化します。2.1. Playwrightプロジェクトの初期化プロジェクト用ディレクトリを作成し、cd します。npm init playwright@latest 20 を実行し、ウィザードに従います。推奨する選択:TypeScriptテストファイルのディレクトリ: tests (デフォルト)GitHub Actions ワークフローの追加: true (将来的なCI/CDの基盤として)2.2. Salesforce向け playwright.config.ts の最適化設定Salesforceの環境（特にSandbox）は、一般的なWebサイトと比較してページの読み込みが遅く、非同期処理（LWCやAuraのコンポーネント遅延読み込み）を多用します。Playwrightのデフォルト設定のままでは、タイムアウトによる不安定な（flaky）テストが多発します。したがって、以下の設定調整が必須です。2.2.1. 環境変数 (.env) の管理npm install dotenv を実行し、プロジェクトルートに .env ファイルを作成します 25。認証情報（ID/パスワード）や環境固有のURL（SandboxのURLなど）をソースコードから分離し、安全に管理します 26。.env (例):Ini, TOML# 一般
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=your.user@dev-org.com
# パスワードとセキュリティトークンを連結
SF_PASSWORD=YourPasswordYourSecurityToken

# 戦略3 (APIログイン) 用
SF_CLIENT_ID=YourConnectedAppClientId
SF_CLIENT_SECRET=YourConnectedAppClientSecret

# テストの基点となるURL (戦略3の場合、global-setup.tsが自動設定するインスタンスURLと一致させる)
SF_BASE_URL=https://your-domain.lightning.force.com
2.2.2. playwright.config.ts (完全版)global-setup.ts を有効化し、タイムアウトをSalesforce用に大幅に延長 27、baseURL を設定します 16。TypeScript// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

//.env ファイルを読み込む
dotenv.config();

// 認証情報ファイルへのパス
const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');

export default defineConfig({
  testDir: './tests', // テストファイルの場所 [53]

  /* ----------------------------------------------------------------- */
  /* Salesforce向け 必須タイムアウト調整                   */
  /* ----------------------------------------------------------------- */
  // LWCやAuraの読み込みは時間がかかるため、デフォルト(30秒)から延長
  timeout: 120 * 1000, // 各テストのタイムアウト (120秒) [27]

  // アサーション(expect)のデフォルト待機時間 (デフォルト5秒は短すぎる)
  expect: {
    // expect().toBeVisible() などの最大待機時間 [28]
    timeout: 20 * 1000, // 20秒
  },

  /* ----------------------------------------------------------------- */
  /* グローバル設定と並列実行                                            */
  /* ----------------------------------------------------------------- */
  fullyParallel: true, // テストの並列実行を有効化 [53]
  forbidOnly:!!process.env.CI, // CI環境では.only を禁止 [53]
  retries: process.env.CI? 2 : 0, // CI環境では失敗したテストを2回リトライ [53]
  workers: process.env.CI? 4 : '50%', // CIでは4並列、ローカルではCPUの半分 [53]

  reporter: 'html', // HTMLレポーターを使用 [53]

  /* ----------------------------------------------------------------- */
  /* 認証 (戦略3: APIログイン) の設定                                    */
  /* ----------------------------------------------------------------- */
  // 1. 最初に実行するグローバルセットアップファイルを指定 [24]
  globalSetup: require.resolve('./global-setup.ts'),

  /* ----------------------------------------------------------------- */
  /* 'use' (全プロジェクトのデフォルト設定)                              */
  /* ----------------------------------------------------------------- */
  use: {
    // 2. global-setup.ts が生成した storageState を全テストで使用
    storageState: authFile,

    // 3. SalesforceのインスタンスURLをbaseURLとして設定 [16, 25]
    //    page.goto('/') がこのURLのルートに解決される
    baseURL: process.env.SF_BASE_URL,

    // ページの読み込み、アクションのタイムアウト [28]
    navigationTimeout: 60 * 1000, // 60秒
    actionTimeout: 30 * 1000,       // 30秒

    // デバッグに非常に役立つトレース機能 [53]
    trace: 'on-first-retry', // 失敗したテストの初回リトライ時にトレースを記録

    // Salesforceはヘッドレスモードで問題なく動作する
    headless: true,
  },

  /* ----------------------------------------------------------------- */
  /* プロジェクト設定 [53]                                          */
  /* ----------------------------------------------------------------- */
  projects:,
        // このプロジェクトは 'setup' が完了してから実行される
        storageState: authFile,
      },
      // global-setup.ts が完了するまで待機
      dependencies: ['setup'],
    },

    // 必要に応じてFirefox, Webkitも追加
    // {
    //   name: 'firefox',
    //   use: {
    //    ...devices,
    //     storageState: authFile,
    //   },
    //   dependencies: ['setup'],
    // },
  ],
});
III. ログイン処理の実装（コードスニペット）このセクションでは、セクションIで解説した各戦略の具体的な global-setup.ts のコードを再掲します。3.1. 【推奨】戦略3: API (Cookieインジェクション) ログインファイル: global-setup.tsコード: セクション 1.3.2. に記載済みのコードスニペットを参照してください。動作: npx playwright test を実行すると、config の globalSetup と dependencies 設定に基づき、setup プロジェクトが global-setup.ts を実行します。jsforce がAPI経由でSalesforceにログインし、セッションIDを取得します 20。Playwrightが起動し、sid Cookieが注入されます 21。ログイン済みのコンテキストが playwright/.auth/user.json に保存されます。chromium プロジェクトが、その user.json を使用してテストを開始します。3.2. 【参考】戦略1: IP許可 + UIログインファイル: global-setup.ts前提: Salesforce側で、テスト実行マシンのIP許可が完了していること (1.1)。コード:TypeScript// global-setup.ts (戦略1: UIログイン版)
// 注意: この方法はCI/CDでは不安定になる可能性が高いです。
import { test as setup, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup('UI authenticate (IP Whitelisted)', async ({ page }) => {
  console.log('Starting UI Login (IP Whitelisted)...');
  await page.goto(process.env.SF_LOGIN_URL!);

  await page.getByLabel('Username').fill(process.env.SF_USERNAME!);
  await page.getByLabel('Password').fill(process.env.SF_PASSWORD!);
  await page.getByRole('button', { name: 'Log In' }).click();

  // IP許可が効いていれば、MFAページをスキップしてホーム画面に直行する
  // (タイムアウトを長く設定)
  await expect(page.getByRole('button', { name: 'App Launcher' }))
   .toBeVisible({ timeout: 120000 });
  console.log('UI Login successful.');

  // ログイン後のセッションを保存
  await page.context().storageState({ path: authFile });
  console.log(`Storage state saved to ${authFile}`);
});
3.3. 【参考】戦略2: storageStateの手動生成ファイル: global-setup.tsコード: セクション 1.2.1. に記載済みのコードスニペットを参照してください。動作:npx playwright test --setup を実行。ブラウザが起動し、ログインページが表示される。開発者が手動でID/PWを入力し、MFA（認証コード）も手動で入力する。ログインが成功すると、Playwrightが user.json を保存する。以降は npx playwright test でテストが実行可能（セッションが失効するまで）。IV. Salesforce特有のセレクタ戦略ログインの次に重要なのが、Salesforceの動的なUI要素を安定して特定する「セレクタ戦略」です。4.1. なぜSalesforceのセレクタは難しいのか？SalesforceのUIは、LWC (Lightning Web Components)、Aura、Visualforceという3世代の技術が混在しており、それぞれに特有の課題があります 20。LWC: Shadow DOM を使用しており、コンポーネント内部の要素がカプセル化されています。Aura: 動的に生成される data-aura-class などを持ちます 20。Visualforce: id 属性に動的なプレフィックスが付与され、テストを困難にします 30。4.2. Playwrightの最大の利点: ネイティブShadow DOMサポートアーキテクチャ上の優位性: Seleniumなどの従来の自動化ツールでは、LWCが使用する「Shadow DOM」 20 にアクセスするために、複雑なJavaScriptの実行（shadowRoot の再帰的な検索）が必要でした。Playwrightの解決策: Playwrightは、Shadow DOMをネイティブにサポートしています 20。セレクタがShadow DOMの境界を自動的に越えて（"piercing"）、要素を検索します。これにより、LWCコンポーネントのテストが劇的に簡素化されます。4.3. 階層的セレクタ戦略（ベストプラクティス）Salesforceのテストを安定させるには、Playwrightのセレクタを以下の優先順位で選択します 33。ユーザー可視のセマンティクス (最優先):page.getByRole(): 「ボタン」「リンク」「チェックボックス」など、要素のARIAロールで検索します。page.getByLabel(): <label> タグや aria-label に関連付けられた要素（入力フィールドなど）を検索します。page.getByText(): ユーザーに見えるテキストコンテンツで検索します。これらはHTMLの構造（div のネストなど）の変更に最も強く、堅牢です。テスト用ID (次点):page.getByTestId(): data-testid 属性で検索します 34。あなたが開発したカスタムLWCには、積極的にこの属性を埋め込むべきです。data-field 36 や data-object 37 など、Salesforceが独自に出力する data-* 属性も locator('[data-field="..."]') の形で利用できます。その他:page.getByPlaceholder(): プレースホルダーテキストで検索します。page.getByTitle(): title 属性で検索します。CSS/XPath (最終手段):page.locator('css=...'), page.locator('xpath=...')動的に生成されるCSSクラス（例: slds-c-button_...）や、絶対XPath（/html/body/div/...）への依存は、非常に壊れやすいため避けてください。4.4. Lightning Web Components (LWC) のセレクタ戦略LWCは lightning-* という標準コンポーネントで構成されます。Playwrightはこれらをネイティブに処理できます。lightning-input 38:ベスト: getByLabel() を使用します。lightning-input の label="取引先名" という属性は、セマンティックな <label for="..."> タグとしてレンダリングされるためです。コード: await page.getByLabel('取引先名').fill('テスト株式会社');lightning-button:ベスト: getByRole('button', { name: '保存' }) を使用します。コード: await page.getByRole('button', { name: 'Save', exact: true }).click();lightning-record-edit-form 36:このフォーム内の lightning-input-field 36 も、field-name 属性に基づいて label を生成します。コード: await page.getByLabel('Account Name').fill('Test Account');カスタムLWCと data-testid 34:あなたが開発したカスタムLWCには、テストの安定性のために data-testid 属性を埋め込みます。LWC HTML: <lightning-button data-testid="custom-save-button" label="Save"></lightning-button>Playwright Test: await page.getByTestId('custom-save-button').click();4.5. Auraコンポーネントのセレクタ戦略Aura（lightning: 名前空間や ui: 名前空間）は、LWCより古いコンポーネントモデルです。data-aura-class 20:Auraコンポーネントは、多くの場合 data-aura-class という属性をレンダリングします。これは、動的に変わる class 属性よりも安定しています。コード: await page.locator("[data-aura-class='forceInput']").fill('Value');aria-label の活用:Auraのボタンやインタラクティブ要素も、アクセシビリティのために aria-label を持つことが多いです。コード: await page.getByLabel('Show Navigation Menu').click();4.6. Visualforceページのセレクタ戦略Visualforceは最も古く、IDが動的に生成されるという最大の問題を抱えています。問題: Visualforce Markupで <apex:inputText id="myId"> と記述しても、レンダリングされるHTMLでは j_id0:j_id1:myId のように、前方に動的なプレフィックスが付与されます。解決策: 「末尾一致」CSSセレクタ 30:Playwrightの locator で、IDの「末尾」(myId) が一致する要素を検索します。コード: await page.locator("[id$='myId']").fill('Value');apex:pageBlockTable 41:Visualforceのテーブルは、class="pbTable" 43 や class="list" 44 といった予測可能なCSSクラスを生成することが多いため、これを利用できます。コード: const table = page.locator('table.pbTable');4.7. セレクタ戦略チートシートSalesforceの3世代のUI技術に対応するためのセレクタ戦略を以下の表にまとめます。Table 2: Salesforceコンポーネント別セレクタ戦略チートシートUI世代コンポーネント例推奨セレクタ (コード例)なぜ？ (解説)LWClightning-inputpage.getByLabel('取引先名')39 label属性がセマンティックな <label> になるため、最も堅牢。LWClightning-buttonpage.getByRole('button', { name: '保存' })33 ユーザーに見えるテキスト/ロールで探すため、変更に強い。LWCカスタムLWCpage.getByTestId('my-custom-element')34 開発者が意図的に付与した、テスト専用の不変ID。LWClightning-record-edit-formpage.getByLabel('Annual Revenue')36 field-name から自動生成される label を使うのが最善。Auraui:input / force:inputpage.locator("[data-aura-class='forceInput']")20 Auraが生成する固有の属性で、比較的安定している。Aura全般page.getByLabel('Menu Name')aria-label や title 属性は、動的IDよりも優先して使用すべき。Visualforce<apex:inputText id="myField">page.locator("[id$='myField']")30 動的プレフィックスを無視し、開発者が指定したIDの末尾で検索する。Visualforce<apex:pageBlockTable>page.locator('table.pbTable')43 Visualforceが生成する予測可能なCSSクラス (.pbTable や .list) を利用する。V. 基本的なテストシナリオ: 「取引先」の新規作成 (TypeScript)最後に、これらすべての知識（戦略3のAPIログイン、configのタイムアウト設定、LWCのセレクタ戦略）を統合し、「取引先（Account）を新規作成し、そのレコードが保存されたことを確認する」という完全なE2Eテストを作成します。5.1. アーキテクチャ上の考慮: テストの独立性とAPIによるクリーンアップE2Eテストのアンチパターン: テストがUIで作成したデータ（例: "Test Account"）を削除せずに終了すること。なぜ問題か: 2回目にテストを実行すると、「重複エラー」（重複ルールや一意のインデックスによる）で失敗する可能性があります 45。また、Sandbox環境がテストデータで汚染されていきます 46。解決策（APIベースのクリーンアップ）:テスト（UI操作）でレコードを新規作成します 47。保存後、ページのURLから新しいレコードID（001...）を取得します。afterEach フック（各テストの後に必ず実行される）で、jsforce 49 を使用して、そのIDのレコードをAPI経由で削除します（Cypressでの例 51 と同じ概念）。利点:テストは**自己完結型（self-contained）**になり、何度実行しても必ず成功します（冪等性）。UIでの削除操作（「削除」ボタンをクリック）を自動化するより、API削除は100倍速く、信頼性も高いです 20。5.2. jsforce をテストコード内で使用するための準備global-setup.ts (1.3.2) で取得し process.env に保存した SF_INSTANCE_URL と SF_SESSION_ID を利用して、各テストファイルで jsforce の接続を復元します。このヘルパー関数を tests/test-utils.ts などの共用ファイルに作成します。TypeScript// tests/test-utils.ts (API接続ヘルパー)
import * as jsforce from 'jsforce';
import * as dotenv from 'dotenv';

//.envファイルも読み込んでおく（process.envへの依存を明確にするため）
dotenv.config();

export function getJsforceConnection() {
  // global-setup.ts が環境変数に設定したセッション情報 (1.3.2参照)
  const instanceUrl = process.env.SF_INSTANCE_URL;
  const sessionId = process.env.SF_SESSION_ID;

  if (!instanceUrl ||!sessionId) {
    throw new Error(
      'JSforce connection details (SF_INSTANCE_URL, SF_SESSION_ID) not found in environment. ' +
      'Ensure global-setup.ts ran successfully and exported these values.'
    );
  }

  // 既存のセッション情報で 'jsforce' 接続を復元
  const conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: sessionId,
  });
  return conn;
}
5.3. E2Eテストケース: 「取引先」新規作成（完全なコード）TypeScript// tests/account.spec.ts
import { test, expect, Page } from '@playwright/test';
import { getJsforceConnection } from './test-utils';
import * as jsforce from 'jsforce';

// このテストスイート（ファイル）全体で、作成したレコードIDを追跡する
const createdAccountIds: string =;
let conn: jsforce.Connection;

test.beforeAll(async () => {
  // テスト実行前にAPI接続を一度だけ初期化
  conn = getJsforceConnection();
});

test.afterAll(async () => {
  // このテストファイル内の全テストが完了した後、作成された全レコードをAPIでクリーンアップ
  if (createdAccountIds.length > 0) {
    console.log(`Cleaning up ${createdAccountIds.length} Account records...`);
    try {
      // 複数のレコードをまとめて削除 (destroy)
      const results = await conn.sobject('Account').del(createdAccountIds);
      console.log('Cleanup successful:', results);
    } catch (err: any) {
      console.error('JSforce cleanup error:', err.message);
    }
  }
});

/**
 * URLからSalesforceのレコードIDを抽出するヘルパー関数
 * @param page PlaywrightのPageオブジェクト
 * @returns 抽出されたレコードID（18桁）、見つからない場合はnull
 */
async function getRecordIdFromUrl(page: Page): Promise<string | null> {
  await page.waitForURL(/\/lightning\/r\/Account\/[a-zA-Z0-9]{18}\/view/, { timeout: 30000 });
  const url = page.url();
  // '001'で始まり、18桁の英数字（標準ID）をキャプチャ
  const match = url.match(/\/Account\/(001[a-zA-Z0-9]{15,18})\/view/);

  if (match && match) {
    // 15桁の場合でも18桁を返す (jsforceは18桁を推奨)
    // SalesforceのIDは常に18桁（API経由の場合）
    // UIは15桁の場合があるが、ここでは18桁を期待する
    if (match.length === 18) {
       return match;
    } else if (match.length === 15) {
       // 15桁 -> 18桁の変換はここでは行わず、18桁のIDがURLに含まれることを期待する
       // (もし15桁のみの場合は、jsforceで18桁に変換する必要がある)
       console.warn(`Captured 15-digit ID: ${match}. 18-digit ID is preferred.`);
       return match; // とりあえず15桁でも返す
    }
  }
  console.warn('Could not extract Account ID from URL for cleanup.');
  return null;
}


test.describe('Salesforce Account Management', () => {

  test('Create and verify a new Account', async ({ page }) => {

    // -----------------------------------------------------------------
    // 1. セットアップ (ログインは global-setup.ts により完了済み)
    // -----------------------------------------------------------------
    // (baseURLはconfigで設定済みのため、相対パスでOK)
    // 「取引先」オブジェクトのリストビューに移動
    await page.goto('/lightning/o/Account/list');

    // -----------------------------------------------------------------
    // 2. 実行 (UI操作) [47]
    // -----------------------------------------------------------------

    // 「新規」ボタンをクリック [47]
    await page.getByRole('button', { name: 'New' }).click();

    // -- 新規取引先モーダルダイアログ内での操作 --

    // 「取引先名」を入力
    // 'Account Name' が見つからない場合は、'取引先名' など組織の言語設定に合わせる
    const accountName = `Playwright Test Account ${new Date().getTime()}`;
    await page.getByLabel('Account Name').fill(accountName);

    // 「電話」を入力
    await page.getByLabel('Phone').fill('555-123-4567');

    // 「種別」を選択 (Picklist)
    // まずラベルでPicklistをクリックして開く
    await page.getByLabel('Type').click();

    // Shadow DOM内のPicklist値を選択 (Playwrightは自動でShadow DOMを貫通)
    // getByRole('option') でドロップダウン内の項目を指定
    await page.getByRole('option', { name: 'Prospect' }).click();

    // 「保存」ボタンをクリック
    // 注意: "Save" と "Save & New" があるため、完全一致(exact: true)で指定
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // -----------------------------------------------------------------
    // 3. 検証 (ToastメッセージとURL)
    // -----------------------------------------------------------------

    // 検証1: 成功の「Toastメッセージ」が表示されること [54, 55]
    // LWCのToastメッセージは 'status' または 'alert' ロールを持つ [56]
    // 'Account "..." was created.' というテキストが含まれることを確認
    const toastLocator = page.getByRole('status').filter({
      hasText: `Account "${accountName}" was created.`
    });

    // Toastは数秒で消えるため、表示されたことを確認する [57, 58]
    await expect(toastLocator).toBeVisible({ timeout: 30000 });
    console.log('Toast message verified.');

    // 検証2: ページが新しいレコード詳細ページに遷移していること
    // URLに 'Account/' と 'view' が含まれていることを確認
    // (getRecordIdFromUrl内で実行される)

    // -----------------------------------------------------------------
    // 4. クリーンアップ準備 (afterAll のため)
    // -----------------------------------------------------------------
    // URLから新しいレコードIDを取得し、クリーンアップリストに追加
    const newId = await getRecordIdFromUrl(page);
    if (newId) {
      createdAccountIds.push(newId); // afterAll フックがこれを使用する
      console.log(`Captured new Account ID for cleanup: ${newId}`);
    }
  });

  // ここに 'Edit Account', 'Delete Account' などの他のテストケースを追加可能
});
