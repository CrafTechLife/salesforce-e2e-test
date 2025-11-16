// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// .envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, './.env') });

// 認証情報ファイルのパス
const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');

// globalSetupで保存されたインスタンスURLを読み込む
const instanceUrlFile = path.join(__dirname, 'playwright', '.auth', 'instance-url.txt');

// ファイルが存在する場合は、そこからインスタンスURLを読み込む。そうでない場合はログインURLを使用
const baseURL = fs.existsSync(instanceUrlFile)
  ? fs.readFileSync(instanceUrlFile, 'utf-8').trim()
  : (process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com');

export default defineConfig({
  testDir: './tests',

  /* ----------------------------------------------------------------- */
  /* Salesforce向け 必須タイムアウト調整                              */
  /* ----------------------------------------------------------------- */
  timeout: 120 * 1000, // 各テストのタイムアウト (120秒)

  expect: {
    timeout: 20 * 1000, // expect().toBeVisible() などの最大待機時間 (20秒)
  },

  /* ----------------------------------------------------------------- */
  /* グローバル設定と並列実行                                          */
  /* ----------------------------------------------------------------- */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : '50%',
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  /* ----------------------------------------------------------------- */
  /* 認証 (戦略3: APIログイン) の設定                                  */
  /* ----------------------------------------------------------------- */
  globalSetup: require.resolve('./tests/setup/globalSetup.ts'),

  /* ----------------------------------------------------------------- */
  /* 'use' (全プロジェクトのデフォルト設定)                            */
  /* ----------------------------------------------------------------- */
  use: {
    // global-setup.ts が生成した storageState を全テストで使用
    storageState: authFile,

    // SalesforceのインスタンスURL (globalSetupで保存されたものを使用)
    baseURL: baseURL,

    // ページの読み込み、アクションのタイムアウト
    navigationTimeout: 60 * 1000, // 60秒
    actionTimeout: 30 * 1000,      // 30秒

    // スクリーンショットとビデオの設定
    screenshot: 'on',  // 常にスクリーンショットを撮影
    video: 'retain-on-failure',  // 失敗時のみビデオを保持

    trace: 'on-first-retry',

    // 環境変数でヘッドレス/ヘッドフルを切り替え可能
    // 例: HEADLESS=false npx playwright test でヘッドフル実行
    headless: process.env.HEADLESS !== 'false',
  },

  /* ----------------------------------------------------------------- */
  /* プロジェクト設定                                                  */
  /* ----------------------------------------------------------------- */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],
});
