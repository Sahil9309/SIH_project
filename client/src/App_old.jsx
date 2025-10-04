import { useState, useEffect } from "react";
import axios from "axios";

// Custom Icons with unique styling
const SendIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const BrainIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0l2.4 7.2L22 12l-7.6 4.8L12 24l-2.4-7.2L2 12l7.6-4.8L12 0z" />
  </svg>
);

function App() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    setIsUploading(true);
    setMessages([]);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      alert(response.data.message);
      setIsReady(true);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. See console for details.");
      setIsReady(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || !isReady) return;

    const newMessages = [...messages, { sender: "user", text: query }];
    setMessages(newMessages);
    setQuery("");
    setIsQuerying(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/query", {
        query,
      });
      setMessages([
        ...newMessages,
        { sender: "bot", text: response.data.answer },
      ]);
    } catch (error) {
      console.error("Error querying:", error);
      setMessages([
        ...newMessages,
        {
          sender: "bot",
          text: "Sorry, an error occurred while getting a response.",
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)]"></div>

      <div className="relative min-h-screen flex flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <DocumentIcon />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              Document Intelligence
            </h1>
            <p className="text-slate-400 text-lg">
              Query your documents in any language
            </p>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar - Upload Section */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <DocumentIcon />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Upload Files
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-400
                        file:mr-4 file:py-3 file:px-5
                        file:rounded-xl file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-500 file:text-white
                        hover:file:bg-indigo-600
                        file:cursor-pointer file:transition-all
                        cursor-pointer
                        border-2 border-dashed border-slate-700
                        rounded-xl p-4
                        hover:border-indigo-500/50 transition-colors"
                      accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                      <p className="text-sm text-slate-400 mb-2">
                        {files.length} file(s) selected
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {Array.from(files).map((file, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-slate-500 truncate"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={isUploading || files.length === 0}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      "Index Documents"
                    )}
                  </button>

                  {isReady && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon />
                      </div>
                      <p className="text-sm text-emerald-400">
                        Ready to answer questions
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-5">
                <h3 className="text-sm font-medium text-slate-300 mb-3">
                  Supported Formats
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["PDF", "PNG", "JPG", "MP3", "WAV", "M4A"].map((format) => (
                    <span
                      key={format}
                      className="px-3 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
                {/* Chat Header */}
                <div className="border-b border-slate-700/50 p-5 bg-slate-800/70">
                  <h2 className="text-xl font-semibold text-white">
                    Conversation
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {isReady
                      ? "Ask me anything about your documents"
                      : "Upload documents to start chatting"}
                  </p>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-10 h-10 text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                        </div>
                        <p className="text-slate-500 text-sm">
                          {isReady
                            ? "Start by asking a question below"
                            : "Upload your documents to begin"}
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg ${
                          msg.sender === "user" ? "order-1" : "order-2"
                        }`}
                      >
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            msg.sender === "user"
                              ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-slate-700/50 text-slate-100 border border-slate-600/30"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                        <p
                          className={`text-xs text-slate-500 mt-1.5 ${
                            msg.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.sender === "user" ? "You" : "Assistant"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isQuerying && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-slate-700/50 border border-slate-600/30 px-4 py-3 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-700/50 p-4 bg-slate-800/70">
                  <form onSubmit={handleQuery} className="flex items-end gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          isReady
                            ? "Type your question..."
                            : "Upload documents first"
                        }
                        disabled={!isReady || isQuerying}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!isReady || isQuerying || !query.trim()}
                      className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex-shrink-0"
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
