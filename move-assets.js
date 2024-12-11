import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'public', 'cards');
const targetDir = path.join(__dirname, 'public', 'assets');

async function moveFiles() {
    try {
        // Create target directory if it doesn't exist
        await fs.mkdir(targetDir, { recursive: true });

        // Get list of files in source directory
        const files = await fs.readdir(sourceDir);

        // Move each file
        for (const file of files) {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            await fs.rename(sourcePath, targetPath);
            console.log(`Moved ${file} to public/assets/`);
        }

        // Remove the old directory
        await fs.rmdir(sourceDir);
        console.log('Removed old cards directory');
    } catch (error) {
        console.error('Error moving files:', error);
    }
}

moveFiles();
