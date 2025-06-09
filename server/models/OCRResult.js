import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
    index: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    startIndex: {
        type: Number,
        default: 0
    },
    wordCount: {
        type: Number,
        default: 0
    },
    length: {
        type: Number,
        default: 0
    }
});

const ocrResultSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    cloudinaryUrl: {
        type: String,
        default: null
    },
    extractedText: {
        type: String,
        required: true
    },
    textStats: {
        wordCount: {
            type: Number,
            default: 0
        },
        characterCount: {
            type: Number,
            default: 0
        },
        chunkCount: {
            type: Number,
            default: 0
        }
    },
    chunks: [chunkSchema],
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },    error: {
        type: String,
        default: null
    },
    // Legal Analysis Results
    legalAnalysis: {
        analysis: String,
        analysisType: String,
        documentType: String,
        timestamp: Date,
        wordCount: Number,
        analysisLength: Number
    },
    // Summary Results
    summaries: {
        executiveSummary: {
            content: String,
            summaryType: String,
            documentType: String,
            timestamp: Date,
            stats: {
                originalWordCount: Number,
                summaryWordCount: Number,
                compressionRatio: Number
            }
        },
        quickSummary: {
            content: String,
            summaryType: String,
            timestamp: Date,
            stats: {
                bulletCount: Number
            }
        }
    },
    // Legal Entity Extraction
    legalEntities: {
        entities: String,
        extractionType: String,
        timestamp: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
ocrResultSchema.index({ userId: 1, createdAt: -1 });
ocrResultSchema.index({ fileId: 1 });

const OCRResult = mongoose.model('OCRResult', ocrResultSchema);

export default OCRResult;
