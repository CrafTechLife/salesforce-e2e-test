はい、Playwrightはそのための非常に強力なレポート機能とメディア（動画・スクリーンショット）キャプチャ機能を提供しています。

ご要望の「ステップごとのキャプチャ」と「動画保存」は、`playwright.config.ts` ファイルの設定と、Playwrightの「HTMLレポーター」機能の組み合わせによって実現できます。

### 1\. 動画で操作を保存する (ビデオ録画)

テスト実行の全操作を動画ファイル（.webm形式）として録画できます。

**設定方法:**
`playwright.config.ts` ファイルの `use` オブジェクトに `video` オプションを追加します。

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  //... 他の設定...
  use: {
    //... baseURL, storageState などの設定...

    // ビデオ録画の設定
    video: 'on-first-retry',
  },
});
```

**`video` オプションの主な設定値:**

  * `'off'`: (デフォルト) 動画を録画しません。
  * `'on'`: すべてのテストで動画を録画します。
  * `'retain-on-failure'`: テストが**失敗した場合にのみ**、動画ファイルを保存します。
  * `'on-first-retry'`: テストが失敗し、**最初のリトライが実行される際**に録画を開始します（CI環境での flaky なテストのデバッグに最適です）。

録画された動画は、`npx playwright show-report` で表示されるHTMLレポートに自動的に添付されます。

### 2\. ステップごとのキャプチャとレポート (トレース機能)

ご要望の「ステップごとにキャプチャをとり」「1つのファイル（レポート）で確認したい」というニーズに最も適しているのは、Playwrightの **「トレースビューア (Trace Viewer)」** 機能です。

これは、単なるスクリーンショットよりもはるかに強力です。テスト中の**すべてのアクション（クリック、入力など）について、その前後のDOMスナップショット**、スクリーンショット、コンソールログ、ネットワークリクエストをすべて記録します。

**設定方法:**
`playwright.config.ts` ファイルの `use` オブジェクトに `trace` オプションを追加します。

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  //... 他の設定...
  use: {
    //... baseURL, storageState などの設定...

    // トレース（ステップごとのスナップショット）の設定
    trace: 'retain-on-failure',

    // （補足）通常のスクリーンショット設定
    screenshot: 'only-on-failure', //
  },

  // HTMLレポーターを有効にする (通常はデフォルト)
  reporter: 'html',
});
```

**`trace` オプションの主な設定値:**

  * `'on'`: すべてのテストでトレースを記録します。
  * `'retain-on-failure'`: テストが**失敗した場合にのみ**、トレースファイルを保存します。（推奨）
  * `'on-first-retry'`: 最初のリトライ時にトレースを記録します。

### 3\. レポート（動画とキャプチャ）の確認方法

上記の設定（`video`, `trace`, `reporter: 'html'`）を行った後、テストを実行します。

```bash
npx playwright test
```

テスト完了後、以下のコマンドを実行すると、ご要望の「1つのファイルで確認できる」HTMLレポートがブラウザで開きます。

```bash
npx playwright show-report
```

このHTMLレポートには：

1.  各テストの成功/失敗のステータスが表示されます。
2.  失敗したテスト（または設定に応じてすべてのテスト）には、「Video」（動画）と「Trace」（トレース）の添付ファイルリンクが表示されます。
3.  「Trace」リンクをクリックすると、ステップごとの詳細なキャプチャ（DOMとスクリーンショット）を確認できる専用ビューアが起動します。

### （上級）任意のステップで手動でスクリーンショットを追加する

もし「トレース機能」とは別に、テストコードの**特定の瞬間**のスクリーンショットをレポートに添付したい場合は、`testInfo.attach` メソッドを使用できます。

**コード例:**

```typescript
// tests/account.spec.ts
import { test, expect } from '@playwright/test';

// testInfo を引数に追加します
test('Create and verify a new Account', async ({ page }, testInfo) => {

  //... (1. 移動, 2. 新規ボタンクリック)...

  const accountName = `Playwright Manual SS Account ${new Date().getTime()}`;
  await page.getByLabel('Account Name').fill(accountName);

  // ★ここで手動でスクリーンショットを撮影し、レポートに添付
  const screenshot = await page.screenshot();
  await testInfo.attach('取引先名を入力後', {
    body: screenshot,
    contentType: 'image/png'
  }); //

  await page.getByLabel('Phone').fill('555-123-4567');

  //... (保存ボタンクリック, 検証)...
});
```

この場合でも、最終的な確認は `npx playwright show-report` で開くHTMLレポートで行います。レポートの該当テストに「取引先名を入力後」という名前のスクリーンショットが添付されます。
