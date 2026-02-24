
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generatePDF() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Path to HTML file (on Desktop)
    const htmlPath = path.join(process.env.USERPROFILE || '', 'Desktop', 'QAntum_Resume.html');
    const pdfPath = path.join(process.env.USERPROFILE || '', 'Desktop', 'QAntum_Resume.pdf');

    if (!fs.existsSync(htmlPath)) {
        console.error(`HTML file not found: ${htmlPath}`);
        process.exit(1);
    }

    // Convert to file URL
    const fileUrl = `file://${htmlPath}`;
    console.log(`Loading: ${fileUrl}`);

    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    // Generate PDF
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px'
        }
    });

    console.log(`PDF Generated: ${pdfPath}`);
    await browser.close();
}

generatePDF().catch(console.error);
