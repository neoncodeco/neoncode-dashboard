
// components/ImageUploader.js (Create this file)
import { useState } from "react";
import { XMarkIcon, PaperClipIcon, CheckIcon } from '@heroicons/react/24/solid';

export default function ImageUploader({ onUploadSuccess, customIcon = null }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedUrl(null); // Reset URL on new file selection
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Client-side file size validation (2MB limit)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        setError("File size exceeds 2MB limit.");
        return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Assuming your upload API is at /api/upload/screenshot
      const res = await fetch("/api/upload/screenshot", { 
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Upload failed");
      }
      
      const screenshot = {
        url: json.url,
        ...(json.deleteUrl ? { deleteUrl: json.deleteUrl } : {}),
      };
      setUploadedUrl(json.url);
      
      // Pass the uploaded screenshot object to the parent component
      onUploadSuccess(screenshot);

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemove = () => {
      setFile(null);
      setUploadedUrl(null);
      setError(null);
      onUploadSuccess(null); // Notify parent component to clear screenshot
  }

  return (
    <div className="flex flex-col items-start gap-2 p-2 bg-gray-100 rounded-lg">
      <div className="flex items-center gap-2">
        <label htmlFor="image-upload" className="cursor-pointer text-gray-500 hover:text-blue-600 transition duration-150">
          {customIcon || <PaperClipIcon className="h-5 w-5" />}
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={uploading || uploadedUrl}
          />
        </label>
        
        {file && (
          <span className="text-sm font-medium truncate max-w-xs">
            {file.name}
          </span>
        )}
        
        {/* Action Buttons */}
        {file && !uploadedUrl && (
            <button 
                onClick={handleUpload}
                disabled={uploading}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition"
            >
                {uploading ? "Uploading..." : "Upload"}
            </button>
        )}
        
        {uploadedUrl && (
            <div className="flex items-center text-green-600 text-sm font-semibold">
                <CheckIcon className="h-4 w-4 mr-1" /> Ready
            </div>
        )}
        
        {file && (
            <button 
                onClick={handleRemove}
                className="text-gray-500 hover:text-red-500 transition"
                aria-label="Remove selected image"
            >
                <XMarkIcon className="h-4 w-4" />
            </button>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
