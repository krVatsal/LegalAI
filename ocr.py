from langchain_text_splitters import CharacterTextSplitter
import os
import pytesseract
from PIL import Image
from langchain_core.documents import Document

# Configure Tesseract path (update this to your Tesseract installation path)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Your image path (using absolute path to avoid issues)
image_path = os.path.join(os.path.dirname(__file__), "WhatsApp Image 2025-05-15 at 17.29.17.jpeg")

try:
    # First check if the image exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    # Display basic image info (optional but helpful for debugging)
    img = Image.open(image_path)
    print(f"Image format: {img.format}, Size: {img.size}, Mode: {img.mode}")

    # Extract text directly using pytesseract instead of UnstructuredImageLoader
    extracted_text = pytesseract.image_to_string(
        img,
        config="--oem 1 --psm 6"  # OCR Engine Mode 1 = Neural nets LSTM, Page Segmentation Mode 6 = Assume single block of text
    )

    # Create a LangChain Document with the extracted text
    doc = Document(page_content=extracted_text)
    print(f"Extraction complete. Text length: {len(extracted_text)}")

    # Split into chunks if needed
    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=20)
    chunks = splitter.split_documents([doc])

    # Print extracted OCR text
    print("\n--- EXTRACTED TEXT ---\n")
    for i, chunk in enumerate(chunks):
        print(f"Chunk {i+1}:")
        print(chunk.page_content)
        print("-" * 50)

except Exception as e:
    print(f"Error processing image: {e}")
