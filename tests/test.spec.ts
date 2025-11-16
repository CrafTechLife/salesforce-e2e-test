// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Salesforce 取引先(Account) 操作', () => {

    test('取引先タブを開き、新規作成モーダルを表示する', async ({ page }) => {

        // ★ 既にログイン済み状態からスタート
        // 直接 取引先(Account) のホーム画面に移動
        await page.goto('/lightning/o/Account/home', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // 1. 取引先のホーム画面が表示されたことを確認（URLチェック）
        await expect(page).toHaveURL(/\/lightning\/o\/Account\/home/, { timeout: 15000 });
        await page.screenshot({ path: 'test-results/screenshots/01-account-home.png', fullPage: true });

        // 2. 「新規」ボタンをクリック
        const newButton = page.getByRole('button', { name: /新規|New/i });
        await newButton.waitFor({ state: 'visible', timeout: 10000 });
        await page.screenshot({ path: 'test-results/screenshots/02-before-click-new.png', fullPage: true });
        await newButton.click();

        // 3. 新規作成モーダル（ダイアログ）が表示されたことを確認
        // エラーボックスではなく、新規取引先のモーダルを特定
        const modal = page.getByRole('dialog', { name: /新規取引先|New Account/i });
        await expect(modal).toBeVisible({ timeout: 10000 });
        await page.screenshot({ path: 'test-results/screenshots/03-new-account-modal.png', fullPage: true });

        console.log('✓ 取引先の新規作成モーダルが正常に表示されました。');
    });

});
