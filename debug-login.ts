// デバッグ用: ログインページの構造を確認するスクリプト
import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function debugLogin() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // あなたのSalesforce URLに置き換えてください
    const baseURL = process.env.SALESFORCE_URL || 'https://login.salesforce.com';
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // ページのHTMLを出力
    const html = await page.content();
    console.log('=== ページHTML (最初の2000文字) ===');
    console.log(html.substring(0, 2000));

    // input要素を全て取得
    const inputs = await page.locator('input').all();
    console.log('\n=== 見つかったinput要素 ===');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const ariaLabel = await input.getAttribute('aria-label');
        console.log(`Input ${i}: id="${id}" name="${name}" type="${type}" aria-label="${ariaLabel}"`);
    }

    // ボタンを全て取得
    const buttons = await page.locator('button, input[type="submit"]').all();
    console.log('\n=== 見つかったbutton要素 ===');
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const id = await button.getAttribute('id');
        const text = await button.textContent();
        console.log(`Button ${i}: id="${id}" text="${text}"`);
    }

    console.log('\n=== スクリーンショット撮影 ===');
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('login-page.png に保存しました');

    // ブラウザは手動で閉じるまで開いたまま
    console.log('\nブラウザを開いたままにします。確認後、手動で閉じてください。');
}

debugLogin().catch(console.error);
