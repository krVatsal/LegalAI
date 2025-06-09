# OCR Service Integration

This OCR service integrates with your existing legal AI backend to provide text extraction from images and PDF files using Tesseract OCR and PyMuPDF.

## Features

- Extract text from images (JPEG, PNG)
- Extract text from PDF files (including scanned PDFs using OCR)
- Upload files to Cloudinary for storage
- Split extracted text into manageable chunks
- Process single or multiple files
- RESTful API endpoints

## Setup Instructions

### 1. Install Node.js Dependencies

```bash
cd server
npm install
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Tesseract OCR

#### Windows:
1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Add to system PATH or update the path in the code

#### macOS:
```bash
brew install tesseract
```

#### Linux:
```bash
sudo apt-get install tesseract-ocr
```

### 4. Environment Variables

Update your `.env` file with Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

### Upload Single File
```
POST /api/ocr/upload-single
Content-Type: multipart/form-data

Form Data:
- file: [Image or PDF file]
```

### Upload Multiple Files
```
POST /api/ocr/upload-multiple
Content-Type: multipart/form-data

Form Data:
- files: [Array of image or PDF files]
```

### Get Text Chunks
```
GET /api/ocr/chunks/:filename?page=1&limit=10
```

## Response Format

```json
{
  "success": true,
  "message": "File processed successfully",
  "data": {
    "filename": "document.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024576,
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "extractedText": "Full extracted text...",
    "textStats": {
      "wordCount": 150,
      "characterCount": 800,
      "chunkCount": 3
    },
    "chunks": [
      {
        "content": "First chunk of text...",
        "startIndex": 0,
        "wordCount": 50
      }
    ]
  }
}
```

## File Limits

- Maximum file size: 10MB
- Maximum files per upload: 10
- Supported formats: JPEG, PNG, PDF

## Error Handling

The service includes comprehensive error handling for:
- Unsupported file types
- File size limits
- OCR processing errors
- Cloudinary upload failures
- File system errors

## Security

- All routes are protected with JWT authentication
- Files are temporarily stored and cleaned up after processing
- File type validation prevents malicious uploads
- File size limits prevent abuse

## Usage Example

```javascript
// Frontend JavaScript example
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/ocr/upload-single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('OCR Result:', data);
});
```

## Troubleshooting

### Common Issues:

1. **Tesseract not found**: Make sure Tesseract is installed and in PATH
2. **Python dependencies**: Install all required Python packages
3. **File permissions**: Ensure temp directory has write permissions
4. **Memory issues**: Large PDF files may require more memory

### Debug Mode:

Enable debug logging by setting:
```env
NODE_ENV=development
```
