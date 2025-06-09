import express from 'express';
import { upload } from '../middleware/multer.middleware.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import OCRService from '../services/ocr.service.python.js';
import OCRResult from '../models/OCRResult.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Upload and process single file for OCR
 */
router.post('/upload-single', upload.single('file'), async (req, res) => {
    try {
        console.log('Single upload - User object:', req.user);
        console.log('Single upload - User ID:', req.user?.id);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { file } = req;
        const localFilePath = file.path;

        // Validate file type
        const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!supportedTypes.includes(file.mimetype)) {
            // Clean up uploaded file
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
            return res.status(400).json({
                success: false,
                message: 'Unsupported file type. Please upload images (JPEG, PNG) or PDF files.'
            });
        }        // Process file with OCR
        console.log('Starting OCR processing for:', file.originalname);
        const ocrResult = await OCRService.processFile(localFilePath, file.mimetype);

        let cloudinaryResponse = null;
        let savedResult = null;

        if (ocrResult.success) {
            // Upload to Cloudinary
            console.log('Uploading to Cloudinary...');
            cloudinaryResponse = await uploadOnCloudinary(localFilePath);
            
            // Generate unique file ID
            const fileId = uuidv4();
            
            // Save OCR result to database
            try {
                savedResult = new OCRResult({
                    fileId: fileId,
                    userId: req.user.id, // From auth middleware
                    filename: file.filename, // Multer generated filename
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    cloudinaryUrl: cloudinaryResponse?.secure_url || null,
                    extractedText: ocrResult.text,
                    textStats: {
                        wordCount: ocrResult.word_count,
                        characterCount: ocrResult.text_length,
                        chunkCount: ocrResult.chunk_count
                    },
                    chunks: ocrResult.chunks,
                    processingStatus: 'completed',
                    error: null
                });
                
                await savedResult.save();
                console.log('OCR result saved to database with ID:', fileId);
            } catch (dbError) {
                console.error('Error saving to database:', dbError);
                // Continue with response even if DB save fails
            }
        } else {
            // Save failed result to database
            const fileId = uuidv4();
            try {
                savedResult = new OCRResult({
                    fileId: fileId,
                    userId: req.user.id,
                    filename: file.filename,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    cloudinaryUrl: null,
                    extractedText: '',
                    textStats: {
                        wordCount: 0,
                        characterCount: 0,
                        chunkCount: 0
                    },
                    chunks: [],
                    processingStatus: 'failed',
                    error: ocrResult.error
                });
                
                await savedResult.save();
            } catch (dbError) {
                console.error('Error saving failed result to database:', dbError);
            }
        }

        // Clean up temporary file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        res.json({
            success: ocrResult.success,
            message: ocrResult.success ? 'File processed successfully' : 'Failed to process file',
            data: {
                fileId: savedResult?.fileId || null,
                filename: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                cloudinaryUrl: cloudinaryResponse?.secure_url || null,
                extractedText: ocrResult.text,
                textStats: {
                    wordCount: ocrResult.word_count,
                    characterCount: ocrResult.text_length,
                    chunkCount: ocrResult.chunk_count
                },
                chunks: ocrResult.chunks.slice(0, 5), // Return first 5 chunks for preview
                error: ocrResult.error || null
            }
        });

    } catch (error) {
        console.error('Error in OCR upload:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during file processing',
            error: error.message
        });
    }
});

/**
 * Upload and process multiple files for OCR
 */
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        console.log('Multiple upload - User object:', req.user);
        console.log('Multiple upload - User ID:', req.user?.id);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const results = [];
        const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        for (const file of req.files) {
            const localFilePath = file.path;

            try {
                // Validate file type
                if (!supportedTypes.includes(file.mimetype)) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: 'Unsupported file type'
                    });
                    
                    // Clean up file
                    if (fs.existsSync(localFilePath)) {
                        fs.unlinkSync(localFilePath);
                    }
                    continue;
                }                // Process file with OCR
                const ocrResult = await OCRService.processFile(localFilePath, file.mimetype);

                let cloudinaryResponse = null;
                let savedResult = null;
                const fileId = uuidv4();

                if (ocrResult.success) {
                    // Upload to Cloudinary
                    cloudinaryResponse = await uploadOnCloudinary(localFilePath);
                    
                    // Save successful result to database
                    try {
                        savedResult = new OCRResult({
                            fileId: fileId,
                            userId: req.user.id,
                            filename: file.filename,
                            originalName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: file.size,
                            cloudinaryUrl: cloudinaryResponse?.secure_url || null,
                            extractedText: ocrResult.text,
                            textStats: {
                                wordCount: ocrResult.word_count,
                                characterCount: ocrResult.text_length,
                                chunkCount: ocrResult.chunk_count
                            },
                            chunks: ocrResult.chunks,
                            processingStatus: 'completed',
                            error: null
                        });
                        
                        await savedResult.save();
                        console.log('OCR result saved to database with ID:', fileId);
                    } catch (dbError) {
                        console.error('Error saving to database:', dbError);
                        // Continue with response even if DB save fails
                    }
                } else {
                    // Save failed result to database
                    try {
                        savedResult = new OCRResult({
                            fileId: fileId,
                            userId: req.user.id,
                            filename: file.filename,
                            originalName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: file.size,
                            cloudinaryUrl: null,
                            extractedText: '',
                            textStats: {
                                wordCount: 0,
                                characterCount: 0,
                                chunkCount: 0
                            },
                            chunks: [],
                            processingStatus: 'failed',
                            error: ocrResult.error
                        });
                        
                        await savedResult.save();
                    } catch (dbError) {
                        console.error('Error saving failed result to database:', dbError);
                    }
                    
                    // Clean up file if OCR failed
                    if (fs.existsSync(localFilePath)) {
                        fs.unlinkSync(localFilePath);
                    }
                }                results.push({
                    fileId: fileId,
                    filename: file.originalname,
                    success: ocrResult.success,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    cloudinaryUrl: cloudinaryResponse?.secure_url || null,
                    extractedText: ocrResult.text,
                    textStats: {
                        wordCount: ocrResult.word_count,
                        characterCount: ocrResult.text_length,
                        chunkCount: ocrResult.chunk_count
                    },
                    chunks: ocrResult.chunks.slice(0, 3), // Return first 3 chunks for each file
                    error: ocrResult.error || null
                });

                // Clean up temporary file
                if (fs.existsSync(localFilePath)) {
                    fs.unlinkSync(localFilePath);
                }} catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                
                // Clean up file
                if (fs.existsSync(localFilePath)) {
                    fs.unlinkSync(localFilePath);
                }

                const errorFileId = uuidv4();
                results.push({
                    fileId: errorFileId,
                    filename: file.originalname,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;

        res.json({
            success: successCount > 0,
            message: `Processed ${successCount}/${totalCount} files successfully`,
            data: {
                totalFiles: totalCount,
                successfulFiles: successCount,
                failedFiles: totalCount - successCount,
                results: results
            }
        });

    } catch (error) {
        console.error('Error in multiple OCR upload:', error);
        
        // Clean up all uploaded files
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during file processing',
            error: error.message
        });
    }
});

/**
 * Get OCR result by file ID
 */
router.get('/result/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Find OCR result by fileId and userId (for security)
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user.id 
        });
        
        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'OCR result not found'
            });
        }
        
        res.json({
            success: true,
            message: 'OCR result retrieved successfully',
            data: {
                fileId: ocrResult.fileId,
                filename: ocrResult.originalName,
                fileType: ocrResult.fileType,
                fileSize: ocrResult.fileSize,
                cloudinaryUrl: ocrResult.cloudinaryUrl,
                extractedText: ocrResult.extractedText,
                textStats: ocrResult.textStats,
                chunks: ocrResult.chunks,
                processingStatus: ocrResult.processingStatus,
                error: ocrResult.error,
                createdAt: ocrResult.createdAt
            }
        });
    } catch (error) {
        console.error('Error retrieving OCR result:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving OCR result',
            error: error.message
        });
    }
});

/**
 * Get text chunks for a specific file (for pagination)
 */
router.get('/chunks/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Find OCR result by fileId and userId (for security)
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user.id 
        });
        
        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'OCR result not found'
            });
        }
        
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedChunks = ocrResult.chunks.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            message: 'Text chunks retrieved successfully',
            data: {
                fileId: fileId,
                filename: ocrResult.originalName,
                page: parseInt(page),
                limit: parseInt(limit),
                totalChunks: ocrResult.chunks.length,
                chunks: paginatedChunks,
                hasMore: endIndex < ocrResult.chunks.length
            }
        });
    } catch (error) {
        console.error('Error retrieving chunks:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving text chunks',
            error: error.message
        });
    }
});

/**
 * Get user's OCR history
 */
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const results = await OCRResult.find({ userId: req.user.id })
            .select('fileId originalName fileType fileSize processingStatus createdAt textStats')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await OCRResult.countDocuments({ userId: req.user.id });
        
        res.json({
            success: true,
            message: 'OCR history retrieved successfully',
            data: {
                results: results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error retrieving OCR history:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving OCR history',
            error: error.message
        });
    }
});

export default router;
