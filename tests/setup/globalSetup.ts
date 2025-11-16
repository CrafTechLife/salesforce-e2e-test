import { chromium, FullConfig } from '@playwright/test';
import * as jsforce from 'jsforce';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env から環境変数を読み込み
dotenv.config();

const authFile = path.join(__dirname, '..', '..', 'playwright', '.auth', 'user.json');

// 保存先ディレクトリが存在しない場合は作成
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}

async function globalSetup(_config: FullConfig) {
    console.log('Starting Global Setup: API Authentication...');

    const conn = new jsforce.Connection({
        loginUrl: process.env.SALESFORCE_LOGIN_URL!,
    });

    const username = process.env.SALESFORCE_USERNAME!;
    // パスワード + セキュリティトークンを連結
    const password = process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_TOKEN!;

    try {
        // OAuth 2.0 ユーザ名パスワードフローでログイン
        // jsforceのloginメソッドは内部でOAuthフローを処理します
        await conn.login(username, password);
        console.log('JSforce login successful. User ID:', conn.userInfo?.id);

        // 戦略3の核心: APIからセッションIDとインスタンスURLを取得
        const sessionId = conn.accessToken;
        const instanceUrl = conn.instanceUrl;

        if (!sessionId || !instanceUrl) {
            throw new Error('Failed to retrieve Session ID or Instance URL from JSforce.');
        }

        console.log(`Retrieved Session ID. Instance URL: ${instanceUrl}`);

        // Playwrightブラウザを起動し、Cookieを注入する
        const browser = await chromium.launch({
            headless: false,  // ヘッドフルモードで実行
            slowMo: 1000      // 動作を1秒遅延（デバッグ用）
        });
        const context = await browser.newContext();

        // 核心部: セッションIDを 'sid' Cookieとしてコンテキストに設定
        const domain = new URL(instanceUrl).hostname; // 例: 'your-domain.lightning.force.com'

        console.log(`Injecting 'sid' cookie for domain: ${domain}`);

        await context.addCookies([
            {
                name: 'sid', // 'sid'がセッションCookieのキー
                value: sessionId,
                domain: domain,
                path: '/',
                httpOnly: true,
                secure: true,
            },
        ]);

        // （オプションだが推奨）一度ページにアクセスし、他の必要なCookieやLocalStorageを初期化
        const page = await context.newPage();
        // waitUntil: 'domcontentloaded' に変更（networkidleは厳しすぎる）
        // タイムアウトも90秒に延長
        await page.goto(instanceUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        console.log('Page loaded. Current URL:', page.url());

        // App Launcherの確認をスキップ（Cookieが正しく設定されていればOK）
        // Salesforceの環境によってはホーム画面が異なる可能性があるため
        // 代わりに、ログインページにリダイレクトされていないことを確認
        const currentUrl = page.url();
        if (currentUrl.includes('/login') || currentUrl.includes('/secur/')) {
            throw new Error(`Cookie injection may have failed. Redirected to: ${currentUrl}`);
        }

        console.log('Cookie injection successful. Session appears valid.');

        // この「API経由でログイン済み」のコンテキスト状態を保存
        await context.storageState({ path: authFile });
        console.log(`API-authenticated storage state saved to ${authFile}`);

        await browser.close();

        // 他のテストで使用するために、設定をグローバルにエクスポート
        process.env.SALESFORCE_INSTANCE_URL = instanceUrl;
        process.env.SALESFORCE_SESSION_ID = sessionId;

        // baseURLとして使用するインスタンスURLをファイルに保存
        const configPath = path.join(__dirname, '..', '..', 'playwright', '.auth', 'instance-url.txt');
        fs.writeFileSync(configPath, instanceUrl, 'utf-8');
        console.log(`Instance URL saved to ${configPath}`);

    } catch (error) {
        console.error('FATAL Error during global-setup (API Login):', error);
        process.exit(1); // セットアップ失敗時はテスト実行を中止
    }
}

export default globalSetup;
