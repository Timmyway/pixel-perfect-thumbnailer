
import React from 'react';
import { ExportSettings } from './ImageEditor';

interface ThumbnailPreviewProps {
  croppedImage: string | null;
  exportSettings: ExportSettings;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  croppedImage,
  exportSettings
}) => {
  if (!croppedImage) {
    return (
      <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
        <div className="text-center">
          <div className="text-slate-400 mb-2">No preview</div>
          <div className="text-xs text-slate-500">
            Upload and crop an image to see preview
          </div>
        </div>
      </div>
    );
  }

  // Calculate preview size maintaining aspect ratio
  const aspectRatio = exportSettings.targetWidth / exportSettings.targetHeight;
  const maxPreviewSize = 200;
  
  let previewWidth, previewHeight;
  if (aspectRatio > 1) {
    // Landscape
    previewWidth = Math.min(maxPreviewSize, exportSettings.targetWidth);
    previewHeight = previewWidth / aspectRatio;
  } else {
    // Portrait or square
    previewHeight = Math.min(maxPreviewSize, exportSettings.targetHeight);
    previewWidth = previewHeight * aspectRatio;
  }

  return (
    <div className="space-y-4">
      <div className="relative flex justify-center">
        <div 
          className="bg-white rounded-lg shadow-md overflow-hidden border relative"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`
          }}
        >
          <img
            src={croppedImage}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
            style={{
              width: '100%',
              height: '100%'
            }}
          />
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow whitespace-nowrap">
            {exportSettings.targetWidth} × {exportSettings.targetHeight}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium text-slate-700">
          Preview
        </div>
        <div className="text-xs text-slate-500">
          {exportSettings.format.toUpperCase()} • {exportSettings.targetWidth}×{exportSettings.targetHeight}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Aspect ratio: {(exportSettings.targetWidth / exportSettings.targetHeight).toFixed(2)}:1
        </div>
      </div>
    </div>
  );
};
