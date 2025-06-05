
import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageUpload: (imageDataUrl: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUpload(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <Card className="shadow-xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors duration-300">
      <div
        className={`p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive ? 'bg-blue-50 border-blue-400' : 'hover:bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-6 rounded-full transition-colors duration-300 ${
            dragActive ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            <ImageIcon className={`w-12 h-12 transition-colors duration-300 ${
              dragActive ? 'text-blue-600' : 'text-slate-500'
            }`} />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Upload Your Image
            </h3>
            <p className="text-slate-600 mb-4">
              Drag and drop an image here, or click to select
            </p>
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Upload className="w-5 h-5" />
              Choose File
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            Supports JPG, PNG, WebP (max 10MB)
          </p>
        </div>
      </div>
    </Card>
  );
};
