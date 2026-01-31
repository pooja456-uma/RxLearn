"use client";
import { useEffect, useState } from "react";
import axios from "axios";

// This defines what a "Prescription" looks like
interface Prescription {
  id: number;
  image_path: string;
  extracted_text: string;
  created_at: string;
}

export default function HistoryPage() {
  const [data, setData] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the history from Python when the page loads
    axios.get("http://127.0.0.1:8000/prescriptions")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching history:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Scan History</h1>
        
        {loading ? (
          <p>Loading records...</p>
        ) : (
          <div className="grid gap-6">
            {data.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                    ID: #{item.id}
                  </span>
                  <span className="text-gray-500 text-sm">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                
                <p className="font-bold text-gray-700 mb-2">Extracted Text:</p>
                <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap text-gray-800">
                  {item.extracted_text}
                </div>
                
                <p className="text-xs text-gray-400 mt-4">File: {item.image_path}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}