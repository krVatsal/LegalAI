import sys
import json
from langchain_text_splitters import CharacterTextSplitter
import os
import pytesseract
from PIL import Image
from langchain_core.documents import Document
import fitz  # PyMuPDF for PDF processing

# Configure Tesseract path (update this to your Tesseract installation path)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class OCRProcessor:
    def __init__(self):
        self.splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=20)
    
    def extract_text_from_image(self, image_path):
        """Extract text from image using OCR"""
        try:
            img = Image.open(image_path)
            extracted_text = pytesseract.image_to_string(
                img,
                config="--oem 1 --psm 6"
            )
            return extracted_text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(pdf_path)
            extracted_text = ""
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # First try to extract text directly
                page_text = page.get_text()
                
                if page_text.strip():
                    extracted_text += f"--- Page {page_num + 1} ---\n{page_text}\n\n"
                else:
                    # If no text found, use OCR on the page image
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    
                    # Save temporary image
                    temp_img_path = f"temp_page_{page_num}.png"
                    with open(temp_img_path, "wb") as f:
                        f.write(img_data)
                    
                    # Extract text using OCR
                    page_text = self.extract_text_from_image(temp_img_path)
                    extracted_text += f"--- Page {page_num + 1} (OCR) ---\n{page_text}\n\n"
                    
                    # Clean up temp file
                    if os.path.exists(temp_img_path):
                        os.remove(temp_img_path)
            
            doc.close()
            return extracted_text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def process_file(self, file_path, file_type):
        """Process file based on type and return extracted text with chunks"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Extract text based on file type
            if file_type.startswith('image/'):
                extracted_text = self.extract_text_from_image(file_path)
            elif file_type == 'application/pdf':
                extracted_text = self.extract_text_from_pdf(file_path)
            else:
                raise Exception(f"Unsupported file type: {file_type}")
            
            # Create LangChain document
            doc = Document(page_content=extracted_text)
            
            # Split into chunks
            chunks = self.splitter.split_documents([doc])
            
            # Prepare response
            result = {
                "success": True,
                "text": extracted_text,
                "text_length": len(extracted_text),
                "word_count": len(extracted_text.split()),
                "chunk_count": len(chunks),
                "chunks": [
                    {
                        "index": i,
                        "content": chunk.page_content,
                        "length": len(chunk.page_content)
                    }
                    for i, chunk in enumerate(chunks)
                ]
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "text_length": 0,
                "word_count": 0,
                "chunk_count": 0,
                "chunks": []
            }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 3:
        result = {
            "success": False,
            "error": "Usage: python ocr.py <file_path> <file_type>"
        }
        print(json.dumps(result))
        sys.stdout.flush()
        return
    
    file_path = sys.argv[1]
    file_type = sys.argv[2]
    
    processor = OCRProcessor()
    result = processor.process_file(file_path, file_type)
    
    # Output JSON result for Node.js to capture
    print(json.dumps(result))
    sys.stdout.flush()

if __name__ == "__main__":
    main()