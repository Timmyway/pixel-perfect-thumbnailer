import React, { useState, useCallback } from 'react';
import { Upload, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageCropper } from './ImageCropper';
import { ImageUpload } from './ImageUpload';
import { TabControls } from './TabControls';
import { ThumbnailPreview } from './ThumbnailPreview';
import { toast } from 'sonner';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface ExportSettings {
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  targetWidth: number;
  targetHeight: number;
}

export const ImageEditor = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 320,
    height: 240,
    zoom: 1
  });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'webp',
    quality: 0.9,
    targetWidth: 320,
    targetHeight: 240
  });
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleImageUpload = useCallback((imageDataUrl: string) => {
    setOriginalImage(imageDataUrl);
    toast.success('Image uploaded successfully!');
  }, []);

  const handleCropChange = useCallback((newCropData: CropData) => {
    setCropData(newCropData);
    // Remove the logic that updates export settings based on crop changes
    // The crop area size is now determined by export settings, not the other way around
  }, []);

  const handleExportSettingsChange = useCallback((newSettings: Partial<ExportSettings>) => {
    setExportSettings(prev => ({ ...prev, ...newSettings }));
    // The cropper will automatically adjust its display size based on the new export settings
  }, []);

  const handleCroppedImageUpdate = useCallback((croppedDataUrl: string) => {
    setCroppedImage(croppedDataUrl);
  }, []);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setCroppedImage(null);
    setCropData({
      x: 0,
      y: 0,
      width: 320,
      height: 240,
      zoom: 1
    });
    setExportSettings({
      format: 'webp',
      quality: 0.9,
      targetWidth: 320,
      targetHeight: 240
    });
    toast.info('Editor reset');
  }, []);

  const handleDownload = useCallback(() => {
    if (!croppedImage) {
      toast.error('No image to download');
      return;
    }

    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `thumbnail.${exportSettings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully!');
  }, [croppedImage, exportSettings.format]);

  if (!originalImage) {
    return (
      <div className="max-w-4xl mx-auto">
        <ImageUpload onImageUpload={handleImageUpload} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2">        
        <div className="flex gap-3 mr-0 ml-auto">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!croppedImage}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card className="p-6 shadow-lg">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
              Crop & Resize
              <span className="text-sm text-slate-500 ml-2 font-normal">
                • Drag to move crop area • Drag corners to resize • Drag outside to pan image when zoomed
              </span>
            </h3>
            <ImageCropper
              imageUrl={originalImage}
              cropData={cropData}
              onCropChange={handleCropChange}
              exportSettings={exportSettings}
              onCroppedImageUpdate={handleCroppedImageUpdate}
            />
          </Card>
        </div>

        {/* Controls & Preview */}
        <div className="space-y-6">
          <Card className="p-6 shadow-lg">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Settings</h3>
            <TabControls
              cropData={cropData}
              onCropChange={handleCropChange}
              exportSettings={exportSettings}
              onExportSettingsChange={handleExportSettingsChange}
            />
          </Card>

          <Card className="p-6 shadow-lg">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Preview</h3>
            <ThumbnailPreview
              croppedImage={croppedImage}
              exportSettings={exportSettings}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
