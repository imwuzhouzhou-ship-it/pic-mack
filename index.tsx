import React, { useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { AnimatedGridPattern } from "./components/ui/animated-grid-pattern";
import { cn } from "./lib/utils";

// Lucide icons for UI
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const WandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64 string (without data:image/xxx;base64, prefix for API, but with it for preview)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }
      setFile(selectedFile);
      const base64 = await fileToBase64(selectedFile);
      setPreviewUrl(base64);
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }
      setFile(selectedFile);
      const base64 = await fileToBase64(selectedFile);
      setPreviewUrl(base64);
      setGeneratedImage(null);
      setError(null);
    }
  };

  const generatePixarStyle = async () => {
    if (!file || !previewUrl) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Separate the mime type and the base64 data
      const base64Data = previewUrl.split(',')[1];
      const mimeType = file.type;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // "nano banana" corresponds to gemini-2.5-flash-image
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: "Transform this image into a 3D Pixar animation style. Make it look like a high-quality 3D render with cute features, expressive eyes, soft lighting, and vibrant colors typical of a Pixar movie. Keep the main subject recognizable but stylized.",
            },
          ],
        },
      });

      let foundImage = false;
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64EncodeString}`;
            setGeneratedImage(imageUrl);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. The model might have returned text instead.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Pattern */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 text-purple-500",
        )}
      />

      {/* Content Container (z-index to float above background) */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-12 animate-float">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 tracking-tight drop-shadow-sm">
            Pixarifier
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turn your photos into magical 3D animated characters using AI.
          </p>
        </div>

        <div className="w-full bg-white/80 rounded-3xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-md">
          <div className="p-8">
            
            {/* Main Action Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Upload */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-600 p-2 rounded-lg">1</span>
                  Upload Image
                </h2>
                
                <div 
                  className={`border-4 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all h-80 relative group cursor-pointer ${
                    previewUrl ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Original" 
                      className="w-full h-full object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-purple-500 transition-colors">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <UploadIcon />
                      </div>
                      <p className="font-medium">Click or drag image here</p>
                      <p className="text-sm mt-2 opacity-70">Supports JPG, PNG</p>
                    </div>
                  )}
                  
                  {previewUrl && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Change Image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Result */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-pink-100 text-pink-600 p-2 rounded-lg">2</span>
                  Pixar Style
                </h2>

                <div className="border-2 border-gray-100 rounded-2xl bg-gray-50/50 h-80 flex items-center justify-center relative overflow-hidden shadow-inner">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <p className="text-purple-600 font-medium animate-pulse">Designing characters...</p>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full h-full group">
                      <img 
                        src={generatedImage} 
                        alt="Generated Pixar Style" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <a 
                        href={generatedImage} 
                        download="pixar-style.png"
                        className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"
                        title="Download"
                      >
                        <DownloadIcon />
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 max-w-xs px-6">
                      <p>Your animated masterpiece will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Action Button & Error */}
            <div className="mt-10 flex flex-col items-center gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl border border-red-100 text-sm">
                  {error}
                </div>
              )}
              
              <button
                onClick={generatePixarStyle}
                disabled={loading || !previewUrl}
                className={`
                  flex items-center gap-3 px-10 py-4 rounded-full text-xl font-bold text-white shadow-xl transition-all transform
                  ${!previewUrl || loading 
                    ? 'bg-gray-300 cursor-not-allowed scale-100' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105 hover:shadow-2xl hover:from-purple-500 hover:to-pink-400 active:scale-95'
                  }
                `}
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <WandIcon />
                    Make it Pixar Style
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm font-medium">
          Powered by Google Gemini 2.5 Flash Image
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);