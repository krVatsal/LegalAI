import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
    constructor() {
        this.pythonScriptPath = path.join(__dirname, '../ocr.py');
    }

    /**
     * Execute Python OCR script using spawn
     */
    async executePythonScript(filePath, fileType) {
        return new Promise((resolve, reject) => {
            console.log(`Starting OCR process for: ${filePath}`);
            
            // Spawn Python process
            const pythonProcess = spawn('python', [this.pythonScriptPath, filePath, fileType]);
            
            let result = '';
            let errorOutput = '';

            // Collect data from Python script
            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            // Collect error output
            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error('Python stderr:', data.toString());
            });

            // Handle process completion
            pythonProcess.on('close', (code) => {
                console.log(`Python process exited with code: ${code}`);
                
                if (code === 0) {
                    try {
                        // Parse JSON result from Python script
                        const parsedResult = JSON.parse(result.trim());
                        resolve(parsedResult);
                    } catch (parseError) {
                        console.error('Error parsing Python output:', parseError);
                        console.error('Raw output:', result);
                        reject(new Error('Failed to parse OCR result'));
                    }
                } else {
                    console.error('Python process failed with code:', code);
                    console.error('Error output:', errorOutput);
                    reject(new Error(`OCR process failed: ${errorOutput || 'Unknown error'}`));
                }
            });

            // Handle process errors
            pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                reject(new Error(`Failed to start OCR process: ${error.message}`));
            });
        });
    }

    /**
     * Process file using Python OCR script
     */
    async processFile(filePath, fileType) {
        try {
            // Validate file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Execute Python OCR script
            const result = await this.executePythonScript(filePath, fileType);
            
            return result;
        } catch (error) {
            console.error('Error in OCR processing:', error);
            return {
                success: false,
                error: error.message,
                text: '',
                text_length: 0,
                word_count: 0,
                chunk_count: 0,
                chunks: []
            };
        }
    }

    /**
     * Split text into chunks (fallback method if Python chunking fails)
     */
    splitTextIntoChunks(text, chunkSize = 500, overlap = 50) {
        const words = text.split(/\s+/);
        const chunks = [];
        
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            chunks.push({
                index: chunks.length,
                content: chunk,
                startIndex: i,
                wordCount: Math.min(chunkSize, words.length - i),
                length: chunk.length
            });
        }
        
        return chunks;
    }

    /**
     * Check if Python and required packages are available
     */
    async checkPythonEnvironment() {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python', ['--version']);
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Python environment check: OK');
                    resolve(true);
                } else {
                    console.error('Python environment check: FAILED');
                    resolve(false);
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('Python not found:', error.message);
                resolve(false);
            });
        });
    }
}

export default new OCRService();
