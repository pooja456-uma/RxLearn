"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("Upload a prescription image to see results...");
  const [loading, setLoading] = useState(false);

  // This function sends the file to your Python Backend
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setText("Scanning... please wait.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Connecting to Port 8000 (your Python backend)
      const response = await axios.post("http://127.0.0.1:8000/ocr", formData);
      setText(response.data.extracted_text);
    } catch (error) {
      console.error(error);
      setText("Error: Could not connect to the backend. Is the black terminal window still open?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-blue-600 mb-2">RxLearn OCR Lab</h1>
      <p className="text-gray-600 mb-8">Upload a prescription to extract the text.</p>
      
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
        
        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        
        {/* Analyze Button */}
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Prescription"}
        </button>

        {/* Results Box */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Results</h3>
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 min-h-[150px] whitespace-pre-wrap font-mono text-sm text-gray-800">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}