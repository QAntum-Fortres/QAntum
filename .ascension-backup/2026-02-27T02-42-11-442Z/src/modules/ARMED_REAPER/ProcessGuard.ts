
import fs from 'fs';
import path from 'path';

const LOCK_FILE = path.resolve('VORTEX_ENGINE.lock');

export class ProcessGuard {

    /**
     * Гарантира, че работи само една инстанция.
     * Ако намери стара - убива я.
     */
    public static ensureSingleInstance() {
        // 1. Проверка за съществуващ Lock File
        if (fs.existsSync(LOCK_FILE)) {
            try {
                const oldPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8'));

                // Проверяваме дали процесът с това ID все още работи
                // process.kill(pid, 0) не убива, а само проверява дали съществува
                process.kill(oldPid, 0);

                console.log(`💀 PROCESS GUARD: Found zombie instance (PID: ${oldPid}). Killing it...`);

                // Убиваме стария процес
                process.kill(oldPid, 'SIGKILL');
                console.log(`✅ ZOMBIE TERMINATED.`);

            } catch (e) {
                // Ако процесът не съществува или има грешка при четенето, просто игнорираме
                // и продължаваме, тъй като Lock File-ът е бил "изоставен" (stale).
            }
        }

        // 2. Записваме текущия PID (Process ID)
        fs.writeFileSync(LOCK_FILE, process.pid.toString());

        // 3. Настройваме почистване при изход
        ProcessGuard.setupCleanup();
    }

    private static setupCleanup() {
        const cleanup = () => {
            try {
                if (fs.existsSync(LOCK_FILE)) {
                    // Чистим файла само ако ние сме го създали (сравняваме PID)
                    const pidInFile = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8'));
                    if (pidInFile === process.pid) {
                        fs.unlinkSync(LOCK_FILE);
                    }
                }
            } catch (e) { }
            process.exit();
        };

        // Прихващаме различни сигнали за спиране
        process.on('SIGINT', cleanup);  // Ctrl+C
        process.on('SIGTERM', cleanup); // Kill command
        process.on('exit', cleanup);    // Normal exit

        // Хващаме и неочаквани грешки, за да не остане файлът
        process.on('uncaughtException', (err) => {
            console.error('CRITICAL ERROR:', err);
            cleanup();
        });
    }
}
