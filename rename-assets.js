import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'public', 'assets');
const targetDir = path.join(__dirname, 'public');

async function renameAndMoveFiles() {
    try {
        // Get list of files in source directory
        const files = await fs.readdir(sourceDir);

        // Move and rename each file
        for (const file of files) {
            if (file === '.gitkeep') continue;
            
            const sourcePath = path.join(sourceDir, file);
            let newName;
            
            if (file === 'BG.png') {
                newName = 'bg.png';
            } else {
                // Extract the number from the filename
                const match = file.match(/^#(\d+)/);
                if (match) {
                    const number = match[1].padStart(2, '0');
                    newName = `card${number}.jpg`;
                } else {
                    continue;
                }
            }
            
            const targetPath = path.join(targetDir, newName);
            await fs.rename(sourcePath, targetPath);
            console.log(`Moved and renamed ${file} to ${newName}`);
        }

        // Remove the old directory
        await fs.rmdir(sourceDir);
        console.log('Removed old assets directory');
    } catch (error) {
        console.error('Error moving files:', error);
    }
}

renameAndMoveFiles();
