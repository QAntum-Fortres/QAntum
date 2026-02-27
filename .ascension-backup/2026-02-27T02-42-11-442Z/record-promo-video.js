const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

async function recordPromoVideo() {
    console.log('[*] Initializing neural visual cortex (headless browser)...');
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
    });

    const page = await browser.newPage();

    // Set up the recorder for social media
    const Config = {
        followNewTab: false,
        fps: 60,
        ffmpeg_Path: null,
        videoFrame: {
            width: 1920,
            height: 1080,
        },
        videoCrf: 18,
        videoCodec: 'libx264',
        videoPreset: 'ultrafast',
        videoBitrate: 4000,
        autopad: {
            color: 'black'
        },
        aspectRatio: '16:9',
    };

    const recorder = new PuppeteerScreenRecorder(page, Config);

    const filePath = path.join(__dirname, 'dashboard', 'qantum-control-panel.html');
    const fileUrl = `file://${filePath}`;

    console.log(`[*] Connecting to AETERNA dashboard: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Wait for the CRT overlay and initial animations
    await new Promise(resolve => setTimeout(resolve, 1500));

    const savePath = path.join(__dirname, 'Aeterna-Promo-TikTok.mp4');
    console.log(`[*] Recording marketing execution to: ${savePath}`);

    await recorder.start(savePath);

    // Simulate user intelligence (mouse move and hover)
    console.log('[*] Executing hover intelligence sequences...');
    await page.mouse.move(100, 100);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hover over the 4 big metric cards
    const cards = await page.$$('.grid-cols-2 > div');
    let xOffsets = [300, 700, 1100, 1500]; // approximate X coords
    let yOffset = 400; // approximate Y coord

    for (let i = 0; i < cards.length; i++) {
        await page.mouse.move(xOffsets[i] || 500, yOffset, { steps: 20 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await cards[i].hover();
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Move to script manager
    console.log('[*] Firing Omni-Command Interface...');
    const executeBtn = await page.$('button.uppercase.tracking-widest'); // The "Execute" button

    await page.mouse.move(960, 600, { steps: 30 });
    await new Promise(resolve => setTimeout(resolve, 400));

    // Focus the input and type
    await page.click('input[placeholder*="metrics:count"]');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.type('input[placeholder*="metrics:count"]', 'aeterna --execute-wealth-bridge --silent=false', { delay: 40 });
    await new Promise(resolve => setTimeout(resolve, 600));

    // Click execute
    if (executeBtn) {
        let box = await executeBtn.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
            await new Promise(resolve => setTimeout(resolve, 200));
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    // Wait to show the result
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log('[*] Terminating video stream...');
    await recorder.stop();

    console.log('[*] Disconnecting cortex...');
    await browser.close();

    console.log('[*] Promo video rendered successfully! Ready for TikTok/IG.');
}

recordPromoVideo().catch(err => {
    console.error('[-] CRITICAL ERROR:', err);
    process.exit(1);
});
