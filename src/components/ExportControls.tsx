
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ExportSettings } from './ImageEditor';

interface ExportControlsProps {
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: Partial<ExportSettings>) => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  exportSettings,
  onExportSettingsChange
}) => {
  const handleDimensionChange = (field: 'targetWidth' | 'targetHeight', value: string) => {
    const numValue = parseInt(value) || 1;
    onExportSettingsChange({
      [field]: Math.max(1, Math.min(4096, numValue))
    });
  };

  const handleQualityChange = (value: number[]) => {
    onExportSettingsChange({
      quality: value[0]
    });
  };

  const handleFormatChange = (format: 'webp' | 'jpeg' | 'png') => {
    onExportSettingsChange({ format });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Output Format
        </Label>
        <Select value={exportSettings.format} onValueChange={handleFormatChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="webp">WebP (Recommended)</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dimensions */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Output Dimensions
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="target-width" className="text-xs text-slate-600">Width (px)</Label>
            <Input
              id="target-width"
              type="number"
              value={exportSettings.targetWidth}
              onChange={(e) => handleDimensionChange('targetWidth', e.target.value)}
              className="mt-1"
              min="1"
              max="4096"
            />
          </div>
          <div>
            <Label htmlFor="target-height" className="text-xs text-slate-600">Height (px)</Label>
            <Input
              id="target-height"
              type="number"
              value={exportSettings.targetHeight}
              onChange={(e) => handleDimensionChange('targetHeight', e.target.value)}
              className="mt-1"
              min="1"
              max="4096"
            />
          </div>
        </div>
      </div>

      {/* Quality Control */}
      {exportSettings.format !== 'png' && (
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Quality: {Math.round(exportSettings.quality * 100)}%
          </Label>
          <Slider
            value={[exportSettings.quality]}
            onValueChange={handleQualityChange}
            max={1}
            min={0.1}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Lower size</span>
            <span>Higher quality</span>
          </div>
        </div>
      )}

      {/* File Size Estimate */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="text-xs text-slate-600">
          <div>Format: <span className="font-medium">{exportSettings.format.toUpperCase()}</span></div>
          <div>Dimensions: <span className="font-medium">{exportSettings.targetWidth} × {exportSettings.targetHeight}</span></div>
          {exportSettings.format !== 'png' && (
            <div>Quality: <span className="font-medium">{Math.round(exportSettings.quality * 100)}%</span></div>
          )}
        </div>
      </div>
    </div>
  );
};
