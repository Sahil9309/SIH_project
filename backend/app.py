from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import fitz
import pytesseract
from PIL import Image
import io
import ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss

# Initialize Flask App
app = Flask(__name__)
# Configure CORS with specific settings
CORS(
    app,
    origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# --- Your Existing RAG System Code (Refactored) ---


def get_text_from_pdf(file_path, langs=["eng", "hin", "ben", "chi_sim"]):
    # ... (copy the function from your final.ipynb)
    content = ""
    pdf_doc = fitz.open(file_path)
    for pg in pdf_doc:
        pg_text = pg.get_text()
        if pg_text.strip():
            content += pg_text
        else:
            img_data = pg.get_pixmap()
            img = Image.open(io.BytesIO(img_data.tobytes()))
            for lang in langs:
                try:
                    content += pytesseract.image_to_string(img, lang=lang)
                    break
                except Exception:
                    continue
    return content


def split_text_into_chunks(text_data):
    # ... (copy the function from your final.ipynb)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", "।", "。", "؟", "!", "?"],
    )
    return splitter.split_text(text_data)


embedding_model = SentenceTransformer(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


def build_vector_index(text_chunks):
    # ... (copy the function from your final.ipynb)
    embeddings = embedding_model.encode(text_chunks)
    dim = embeddings.shape[1]
    vector_index = faiss.IndexFlatL2(dim)
    vector_index.add(embeddings)
    return vector_index, embeddings


class DocumentQASystem:
    # ... (copy the class from your final.ipynb)
    def __init__(self, vector_index, text_chunks):
        self.vector_index = vector_index
        self.text_chunks = text_chunks

    def generate_detailed_response(self, context, query):
        prompt = f"Query: {query}\nContext: {context}\n\nResponse:"
        response = ollama.generate(
            model="llama3",
            prompt=prompt,
        )
        return response["response"]

    def get_answer(self, query, top_k=5):
        query_embed = embedding_model.encode([query])
        _, closest_indices = self.vector_index.search(query_embed, top_k)
        relevant_text = "\n\n".join(
            [self.text_chunks[idx] for idx in closest_indices[0]]
        )
        return self.generate_detailed_response(relevant_text, query)


# --- Global variables to hold the QA system ---
qa_system = None
text_chunks = []


# --- API Endpoints ---
@app.route("/upload", methods=["POST"])
def upload_files():
    global qa_system, text_chunks
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files part in the request"}), 400

        files = request.files.getlist("files")
        if not files or all(file.filename == "" for file in files):
            return jsonify({"error": "No files selected"}), 400

        pdf_paths = []
        # Create a directory for uploads if it doesn't exist
        if not os.path.exists("data"):
            os.makedirs("data")

        # Validate and save files
        for file in files:
            if file and file.filename:
                if not file.filename.lower().endswith(".pdf"):
                    return (
                        jsonify(
                            {
                                "error": f"File {file.filename} is not a PDF. Only PDF files are supported."
                            }
                        ),
                        400,
                    )

                # Sanitize filename
                filename = (
                    file.filename.replace("..", "").replace("/", "").replace("\\", "")
                )
                filepath = os.path.join("data", filename)

                try:
                    file.save(filepath)
                    pdf_paths.append(filepath)
                except Exception as e:
                    return (
                        jsonify({"error": f"Failed to save file {filename}: {str(e)}"}),
                        500,
                    )

        if not pdf_paths:
            return jsonify({"error": "No valid PDF files uploaded"}), 400

        # Process PDFs
        all_text_parts = []
        processed_files = []

        for file_path in pdf_paths:
            try:
                extracted_text = get_text_from_pdf(file_path)
                if not extracted_text.strip():
                    return (
                        jsonify(
                            {
                                "error": f"No text could be extracted from {os.path.basename(file_path)}"
                            }
                        ),
                        400,
                    )

                parts = split_text_into_chunks(extracted_text)
                all_text_parts.extend(parts)
                processed_files.append(os.path.basename(file_path))

            except Exception as e:
                return (
                    jsonify(
                        {
                            "error": f"Failed to process {os.path.basename(file_path)}: {str(e)}"
                        }
                    ),
                    500,
                )

        if not all_text_parts:
            return jsonify({"error": "No text content found in uploaded files"}), 400

        # Build vector index
        try:
            vector_index, _ = build_vector_index(all_text_parts)
            text_chunks = all_text_parts
            qa_system = DocumentQASystem(vector_index, text_chunks)
        except Exception as e:
            return (
                jsonify({"error": f"Failed to build search index: {str(e)}"}),
                500,
            )

        return jsonify(
            {
                "message": "Files uploaded and processed successfully!",
                "processed_files": processed_files,
                "total_chunks": len(all_text_parts),
            }
        )

    except Exception as e:
        return jsonify({"error": f"Unexpected error during upload: {str(e)}"}), 500


@app.route("/query", methods=["POST"])
def query_system_endpoint():
    global qa_system
    try:
        if not qa_system:
            return (
                jsonify(
                    {
                        "error": "No documents have been processed yet. Please upload PDF files first."
                    }
                ),
                400,
            )

        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        if "query" not in data or not data["query"]:
            return jsonify({"error": "No query provided"}), 400

        query = data["query"].strip()
        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        if len(query) > 1000:
            return jsonify({"error": "Query too long. Maximum 1000 characters."}), 400

        try:
            answer = qa_system.get_answer(query)
            if not answer:
                return (
                    jsonify(
                        {
                            "error": "No answer could be generated. Please try rephrasing your question."
                        }
                    ),
                    500,
                )

            return jsonify({"answer": answer, "query": query})

        except Exception as e:
            return (
                jsonify({"error": f"Failed to generate answer: {str(e)}"}),
                500,
            )

    except Exception as e:
        return jsonify({"error": f"Unexpected error during query: {str(e)}"}), 500


# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify(
        {"status": "healthy", "message": "Document Intelligence API is running"}
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
