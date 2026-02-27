const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

async function recordVideo() {
    console.log('Starting browser...');
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set up the recorder
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
        videoBitrate: 1000,
        autopad: {
            color: 'black'
        },
        aspectRatio: '16:9',
    };
    
    const recorder = new PuppeteerScreenRecorder(page, Config);
    
    const filePath = path.join(__dirname, 'qantum-prime-architecture.html');
    const fileUrl = `file://${filePath}`;
    
    console.log(`Navigating to ${fileUrl}...`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Wait a moment for the canvas animation to start smoothly
    await new Promise(resolve => setTimeout(resolve, 1000));

    const savePath = path.join(__dirname, 'Qantum-Prime-Showcase.mp4');
    console.log(`Recording video to ${savePath}...`);
    
    await recorder.start(savePath);

    // Scroll down slowly to show the whole page
    console.log('Scrolling through the architecture...');
    await page.evaluate(async () => {
        const container = document.querySelector('.container');
        const distance = 2; // pixels per frame
        const delay = 16; // ~60fps
        
        while (container.scrollTop + container.clientHeight < container.scrollHeight) {
            container.scrollBy(0, distance);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Wait at the bottom for a few seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
    });

    console.log('Stopping recording...');
    await recorder.stop();
    
    console.log('Closing browser...');
    await browser.close();
    
    console.log('Video generated successfully!');
}

recordVideo().catch(err => {
    console.error('Error generating video:', err);
    process.exit(1);
});
