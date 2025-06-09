
import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { UploadIcon } from './Icon';

interface ImageImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onChartGenerated: (chartData: any) => void; // Argument type depends on Gemini output structure
}

export const ImageImporter: React.FC<ImageImporterProps> = ({ isOpen, onClose, onChartGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numColors, setNumColors] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null); // Clear previous result
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !previewUrl) {
      alert('Please select an image file.');
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null);

    // Extract base64 data from previewUrl (e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...")
    const base64Data = previewUrl.split(',')[1];
    if (!base64Data) {
        alert('Could not read image data.');
        setIsLoading(false);
        return;
    }

  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setIsLoading(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Image to Chart Converter" size="lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="imageFile" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Upload Image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 dark:border-neutral-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {/* Fix: className prop is correctly passed to UploadIcon as Icon.tsx has been updated */}
              <UploadIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
              <div className="flex text-sm text-neutral-600 dark:text-neutral-400">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-white dark:bg-neutral-700 rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-neutral-800 focus-within:ring-primary"
                >
                  <span>Upload a file</span>
                  <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="text-center">
            <img src={previewUrl} alt="Preview" className="max-h-60 max-w-full mx-auto border border-neutral-300 dark:border-neutral-600 rounded" />
          </div>
        )}

        <div>
          <label htmlFor="numColors" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Number of Colors</label>
          <select
            id="numColors"
            value={numColors}
            onChange={(e) => setNumColors(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-neutral-700"
          >
            {[2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => <option key={n} value={n}>{n} Colors</option>)}
          </select>
        </div>

        {analysisResult && (
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600">
                <h4 className="font-semibold text-sm mb-1">Analysis Result:</h4>
                <p className="text-xs whitespace-pre-wrap">{analysisResult}</p>
            </div>
        )}

        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
          Image analysis uses Gemini AI. Results are conceptual and may require manual chart creation.
        </p>
      </div>
      <div className="pt-5">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isLoading} isLoading={isLoading}>
            {isLoading ? 'Analyzing...' : 'Convert to Chart (Analyze)'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
