import { useState, useEffect } from 'react';
import axios from 'axios';

// Custom Icons with unique styling
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0l2.4 7.2L22 12l-7.6 4.8L12 24l-2.4-7.2L2 12l7.6-4.8L12 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

function App() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ processedFiles: [], totalChunks: 0 });

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select PDF files to upload.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessages([]);
    setError('');
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setStats({
        processedFiles: response.data.processed_files || [],
        totalChunks: response.data.total_chunks || 0
      });
      setIsReady(true);
      
      // Add welcome message
      setTimeout(() => {
        setMessages([{
          sender: 'assistant',
          text: `✨ Great! I've successfully processed ${response.data.processed_files?.length || 0} document(s) and created ${response.data.total_chunks || 0} searchable chunks. You can now ask me anything about your documents!`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      console.error('Error uploading files:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload files. Please try again.';
      setError(errorMessage);
      setIsReady(false);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || !isReady) return;

    const userMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuery('');
    setIsQuerying(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/query', { query });
      const assistantMessage = {
        sender: 'assistant',
        text: response.data.answer,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error querying:', error);
      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error while processing your question.';
      const errorResponse = {
        sender: 'assistant',
        text: `❌ ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages([...newMessages, errorResponse]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center animate-pulse-glow">
                    <BrainIcon />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <SparkleIcon />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    DocuMind AI
                  </h1>
                  <p className="text-slate-400 text-sm">Intelligent Document Analysis Platform</p>
                </div>
              </div>
              
              {isReady && (
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>System Ready</span>
                  </div>
                  <div className="text-slate-400">
                    {stats.processedFiles.length} docs • {stats.totalChunks} chunks
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
              
              {/* Upload Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-dark rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                      <UploadIcon />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Document Upload</h2>
                      <p className="text-slate-400 text-sm">Upload your PDF documents</p>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".pdf"
                    />
                    <div className="border-2 border-dashed border-slate-600 hover:border-blue-500/50 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-slate-800/30">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center">
                          <DocumentIcon />
                        </div>
                        <div>
                          <p className="text-white font-medium">Drop PDF files here</p>
                          <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-slate-300 font-medium">{files.length} file(s) selected:</p>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {Array.from(files).map((file, idx) => (
                          <div key={idx} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded-lg">
                            <DocumentIcon />
                            <span className="text-sm text-slate-300 truncate flex-1">{file.name}</span>
                            <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-300">Processing documents...</span>
                        <span className="text-blue-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300 shimmer"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2">
                      <ErrorIcon />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Upload Button */}
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || files.length === 0}
                    className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon />
                        <span>Analyze Documents</span>
                      </>
                    )}
                  </button>

                  {/* Ready Status */}
                  {isReady && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 animate-slide-up">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      <div>
                        <p className="text-emerald-400 font-medium">Ready for Questions</p>
                        <p className="text-emerald-300/70 text-sm">Your documents have been processed successfully</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Panel */}
                <div className="glass-dark rounded-2xl p-5 border border-slate-700/30">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center space-x-2">
                    <SparkleIcon />
                    <span>AI Capabilities</span>
                  </h3>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Multi-language document analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                      <span>Intelligent text extraction & OCR</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      <span>Contextual question answering</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span>Semantic search & retrieval</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Panel */}
              <div className="lg:col-span-8">
                <div className="glass-dark rounded-3xl border border-slate-700/50 shadow-2xl h-full flex flex-col overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
                        <p className="text-slate-400 text-sm">
                          {isReady ? 'Ask me anything about your documents' : 'Upload documents to start chatting'}
                        </p>
                      </div>
                      {messages.length > 0 && (
                        <button
                          onClick={() => setMessages([])}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
                        >
                          Clear Chat
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <BrainIcon />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">Ready to Help</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {isReady 
                              ? "I've analyzed your documents and I'm ready to answer your questions. Try asking about specific topics, summaries, or details from your files."
                              : "Upload your PDF documents first, then I'll be ready to answer any questions about their content."
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                          <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                            <div className={`px-5 py-4 rounded-2xl ${
                              msg.sender === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
                                : msg.isError
                                ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                : 'bg-slate-800/70 text-slate-100 border border-slate-700/30'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <div className={`flex items-center space-x-2 mt-2 text-xs text-slate-500 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <span>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                              <span>•</span>
                              <span>{msg.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isQuerying && (
                      <div className="flex justify-start animate-slide-up">
                        <div className="bg-slate-800/70 border border-slate-700/30 px-5 py-4 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                            <span className="text-slate-400 text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                    <form onSubmit={handleQuery} className="flex items-end space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={isReady ? "Ask me anything about your documents..." : "Upload documents first"}
                          disabled={!isReady || isQuerying}
                          className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          maxLength={1000}
                        />
                        <div className="flex justify-between items-center mt-2 px-1">
                          <span className="text-xs text-slate-500">
                            {query.length}/1000 characters
                          </span>
                          {query.length > 800 && (
                            <span className="text-xs text-amber-400">
                              Approaching limit
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!isReady || isQuerying || !query.trim()}
                        className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                        aria-label="Send message"
                      >
                        <SendIcon />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;