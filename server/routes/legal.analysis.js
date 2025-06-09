import express from 'express';
import LegalAnalysisService from '../services/legal.analysis.service.js';
import OCRResult from '../models/OCRResult.js';

const router = express.Router();
const legalService = new LegalAnalysisService();

/**
 * Generate comprehensive legal analysis for a document
 */
router.post('/analyze/:fileId', async (req, res) => {
    try {
        console.log('Legal analysis request for fileId:', req.params.fileId);
        console.log('User ID:', req.user._id);
        
        const { fileId } = req.params;
        const { documentType = 'contract' } = req.body;

        // Find the OCR result for this file
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user._id 
        });

        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'Document not found. Please upload and process the document first.'
            });
        }

        if (!ocrResult.extractedText || ocrResult.extractedText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No extracted text found. Please ensure OCR processing was successful.'
            });
        }

        // Perform legal analysis
        console.log('Starting legal analysis...');
        const analysisResult = await legalService.analyzeLegalDocument(
            ocrResult.extractedText, 
            documentType
        );

        if (!analysisResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to perform legal analysis',
                error: analysisResult.error
            });
        }

        // Update OCR result with analysis
        ocrResult.legalAnalysis = {
            analysis: analysisResult.analysis,
            analysisType: analysisResult.analysisType,
            documentType: analysisResult.documentType,
            timestamp: new Date(),
            wordCount: analysisResult.wordCount,
            analysisLength: analysisResult.analysisLength
        };

        await ocrResult.save();
        console.log('Legal analysis completed and saved');

        res.json({
            success: true,
            message: 'Legal analysis completed successfully',
            data: {
                fileId: fileId,
                filename: ocrResult.originalName,
                analysis: analysisResult.analysis,
                analysisType: analysisResult.analysisType,
                documentType: analysisResult.documentType,
                timestamp: analysisResult.timestamp,
                stats: {
                    originalWordCount: analysisResult.wordCount,
                    analysisWordCount: analysisResult.analysisLength
                }
            }
        });

    } catch (error) {
        console.error('Error in legal analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during legal analysis',
            error: error.message
        });
    }
});

/**
 * Generate executive summary for a document
 */
router.post('/summary/:fileId', async (req, res) => {
    try {
        console.log('Summary generation request for fileId:', req.params.fileId);
        console.log('User ID:', req.user._id);
        
        const { fileId } = req.params;
        const { documentType = 'contract', summaryType = 'executive' } = req.body;

        // Find the OCR result for this file
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user._id 
        });

        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'Document not found. Please upload and process the document first.'
            });
        }

        if (!ocrResult.extractedText || ocrResult.extractedText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No extracted text found. Please ensure OCR processing was successful.'
            });
        }

        let summaryResult;
        
        // Generate different types of summaries based on request
        if (summaryType === 'quick') {
            console.log('Generating quick bullet summary...');
            summaryResult = await legalService.generateQuickSummary(
                ocrResult.extractedText, 
                req.body.maxBullets || 8
            );
        } else {
            console.log('Generating executive summary...');
            summaryResult = await legalService.generateLegalSummary(
                ocrResult.extractedText, 
                documentType
            );
        }

        if (!summaryResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate summary',
                error: summaryResult.error
            });
        }

        // Update OCR result with summary
        const summaryField = summaryType === 'quick' ? 'quickSummary' : 'executiveSummary';
        
        if (!ocrResult.summaries) {
            ocrResult.summaries = {};
        }
        
        ocrResult.summaries[summaryField] = {
            content: summaryResult.summary || summaryResult.quickSummary,
            summaryType: summaryResult.summaryType,
            documentType: summaryResult.documentType,
            timestamp: new Date(),
            stats: {
                originalWordCount: summaryResult.originalWordCount,
                summaryWordCount: summaryResult.summaryWordCount,
                compressionRatio: summaryResult.compressionRatio,
                bulletCount: summaryResult.bulletCount
            }
        };

        await ocrResult.save();
        console.log('Summary generated and saved');

        res.json({
            success: true,
            message: 'Summary generated successfully',
            data: {
                fileId: fileId,
                filename: ocrResult.originalName,
                summary: summaryResult.summary || summaryResult.quickSummary,
                summaryType: summaryResult.summaryType,
                documentType: summaryResult.documentType || documentType,
                timestamp: summaryResult.timestamp,
                stats: {
                    originalWordCount: summaryResult.originalWordCount,
                    summaryWordCount: summaryResult.summaryWordCount,
                    compressionRatio: summaryResult.compressionRatio,
                    bulletCount: summaryResult.bulletCount
                }
            }
        });

    } catch (error) {
        console.error('Error in summary generation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during summary generation',
            error: error.message
        });
    }
});

/**
 * Extract legal entities and key information from document
 */
router.post('/entities/:fileId', async (req, res) => {
    try {
        console.log('Entity extraction request for fileId:', req.params.fileId);
        console.log('User ID:', req.user._id);
        
        const { fileId } = req.params;

        // Find the OCR result for this file
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user._id 
        });

        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'Document not found. Please upload and process the document first.'
            });
        }

        if (!ocrResult.extractedText || ocrResult.extractedText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No extracted text found. Please ensure OCR processing was successful.'
            });
        }

        // Extract entities
        console.log('Starting entity extraction...');
        const entityResult = await legalService.extractLegalEntities(ocrResult.extractedText);

        if (!entityResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to extract entities',
                error: entityResult.error
            });
        }

        // Update OCR result with entities
        ocrResult.legalEntities = {
            entities: entityResult.entities,
            extractionType: entityResult.extractionType,
            timestamp: new Date()
        };

        await ocrResult.save();
        console.log('Entity extraction completed and saved');

        res.json({
            success: true,
            message: 'Legal entities extracted successfully',
            data: {
                fileId: fileId,
                filename: ocrResult.originalName,
                entities: entityResult.entities,
                extractionType: entityResult.extractionType,
                timestamp: entityResult.timestamp
            }
        });

    } catch (error) {
        console.error('Error in entity extraction:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during entity extraction',
            error: error.message
        });
    }
});

/**
 * Get all legal analysis results for a document
 */
router.get('/results/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Find the OCR result with all legal analysis data
        const ocrResult = await OCRResult.findOne({ 
            fileId: fileId, 
            userId: req.user._id 
        });

        if (!ocrResult) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.json({
            success: true,
            message: 'Legal analysis results retrieved successfully',
            data: {
                fileId: fileId,
                filename: ocrResult.originalName,
                hasAnalysis: !!ocrResult.legalAnalysis,
                hasSummaries: !!ocrResult.summaries,
                hasEntities: !!ocrResult.legalEntities,
                legalAnalysis: ocrResult.legalAnalysis || null,
                summaries: ocrResult.summaries || null,
                legalEntities: ocrResult.legalEntities || null,
                textStats: ocrResult.textStats
            }
        });

    } catch (error) {
        console.error('Error retrieving legal analysis results:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Get legal analysis history for user
 */
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find documents with legal analysis
        const results = await OCRResult.find({ 
            userId: req.user._id,
            $or: [
                { legalAnalysis: { $exists: true } },
                { summaries: { $exists: true } },
                { legalEntities: { $exists: true } }
            ]
        })
        .select('fileId originalName fileType fileSize legalAnalysis summaries legalEntities createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await OCRResult.countDocuments({ 
            userId: req.user._id,
            $or: [
                { legalAnalysis: { $exists: true } },
                { summaries: { $exists: true } },
                { legalEntities: { $exists: true } }
            ]
        });

        res.json({
            success: true,
            message: 'Legal analysis history retrieved successfully',
            data: {
                results: results.map(result => ({
                    fileId: result.fileId,
                    filename: result.originalName,
                    fileType: result.fileType,
                    fileSize: result.fileSize,
                    hasAnalysis: !!result.legalAnalysis,
                    hasSummaries: !!result.summaries,
                    hasEntities: !!result.legalEntities,
                    createdAt: result.createdAt,
                    lastAnalysisDate: result.legalAnalysis?.timestamp || 
                                     result.summaries?.executiveSummary?.timestamp || 
                                     result.summaries?.quickSummary?.timestamp ||
                                     result.legalEntities?.timestamp
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error retrieving legal analysis history:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving legal analysis history',
            error: error.message
        });
    }
});

export default router;
