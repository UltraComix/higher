import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'assets');
const targetDir = path.join(__dirname, 'public', 'cards');

async function copyFiles() {
    try {
        // Create target directory if it doesn't exist
        await fs.mkdir(targetDir, { recursive: true });

        // Get list of files in source directory
        const files = await fs.readdir(sourceDir);

        // Copy each file
        for (const file of files) {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);
            await fs.copyFile(sourcePath, targetPath);
            console.log(`Copied ${file} to public/cards/`);
        }
    } catch (error) {
        console.error('Error copying files:', error);
    }
}

copyFiles();
