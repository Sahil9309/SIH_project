from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import whisper
from transformers import BlipProcessor, BlipForConditionalGeneration

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # This is crucial for fixing the CORS error

# --- Load Models (Done once on startup) ---
print("Loading models, this might take a moment...")
embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
whisper_model = whisper.load_model("base")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")
print("Models loaded successfully.")

# --- Text Extraction Functions ---

def get_text_from_pdf(file_path, langs=['eng', 'hin', 'ben', 'chi_sim']):
    content = ""
    try:
        pdf_doc = fitz.open(file_path)
        for pg in pdf_doc:
            pg_text = pg.get_text()
            if pg_text.strip():
                content += pg_text
            else: # If no text, try OCR
                pix = pg.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes()))
                for lang in langs:
                    try:
                        content += pytesseract.image_to_string(img, lang=lang)
                        break
                    except:
                        continue
    except Exception as e:
        print(f"Error processing PDF {file_path}: {e}")
    return content

def get_text_from_image(image_path):
    try:
        raw_image = Image.open(image_path).convert('RGB')
        inputs = blip_processor(raw_image, return_tensors="pt")
        out = blip_model.generate(**inputs)
        return blip_processor.decode(out[0], skip_special_tokens=True)
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return ""

def get_text_from_audio(audio_path):
    try:
        result = whisper_model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        print(f"Error processing audio {audio_path}: {e}")
        return ""


def split_text_into_chunks(text_data):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", "।", "。", "؟", "!", "?"]
    )
    return splitter.split_text(text_data)

def build_vector_index(text_chunks):
    embeddings = embedding_model.encode(text_chunks)
    dim = embeddings.shape[1]
    vector_index = faiss.IndexFlatL2(dim)
    vector_index.add(embeddings)
    return vector_index, embeddings

class DocumentQASystem:
    def __init__(self, vector_index, text_chunks):
        self.vector_index = vector_index
        self.text_chunks = text_chunks

    def generate_detailed_response(self, context, query):
        prompt = f"""You are a helpful AI assistant. Use the following context to answer the user's question. If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question:
{query}

Answer:"""
        response = ollama.generate(
            model='llama3',
            prompt=prompt,
        )
        return response['response']

    def get_answer(self, query, top_k=5):
        query_embed = embedding_model.encode([query])
        _, closest_indices = self.vector_index.search(query_embed, top_k)
        relevant_text = "\n\n---\n\n".join([self.text_chunks[idx] for idx in closest_indices[0]])
        return self.generate_detailed_response(relevant_text, query)

# --- Global variables ---
qa_system = None
text_chunks = []

# --- API Endpoints ---
@app.route('/upload', methods=['POST'])
def upload_files():
    global qa_system, text_chunks
    if 'files' not in request.files:
        return jsonify({'error': 'No files part in the request'}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({'error': 'No files selected'}), 400
        
    upload_folder = "data"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    all_text_parts = []
    for file in files:
        filepath = os.path.join(upload_folder, file.filename)
        file.save(filepath)
        extracted_text = ""
        
        print(f"Processing {file.filename}...")

        if file.filename.lower().endswith('.pdf'):
            extracted_text = get_text_from_pdf(filepath)
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            extracted_text = get_text_from_image(filepath)
        elif file.filename.lower().endswith(('.mp3', '.wav', '.m4a')):
            extracted_text = get_text_from_audio(filepath)
        
        if extracted_text:
            parts = split_text_into_chunks(extracted_text)
            all_text_parts.extend(parts)

    if not all_text_parts:
        return jsonify({'error': 'Could not extract any text from the uploaded files.'}), 400

    vector_index, _ = build_vector_index(all_text_parts)
    text_chunks = all_text_parts
    qa_system = DocumentQASystem(vector_index, text_chunks)

    return jsonify({'message': f'{len(files)} file(s) processed and indexed successfully!'})

@app.route('/query', methods=['POST'])
def query_system_endpoint():
    global qa_system
    if not qa_system:
        return jsonify({'error': 'No documents have been processed yet.'}), 400

    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    query = data['query']
    answer = qa_system.get_answer(query)
    return jsonify({'answer': answer})

if __name__ == '__main__':
    app.run(debug=True, port=5000)