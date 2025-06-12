
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ExportSettings } from './ImageEditor';

interface ExportControlsProps {
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: Partial<ExportSettings>) => void;
}

const PRESET_SIZES = [
  { name: 'Custom', width: 0, height: 0 },
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Instagram Portrait', width: 1080, height: 1350 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'LinkedIn Banner', width: 1584, height: 396 },
  { name: 'Standard Thumbnail', width: 320, height: 240 },
  { name: 'Small Avatar', width: 128, height: 128 },
  { name: 'Medium Avatar', width: 256, height: 256 },
  { name: 'HD (16:9)', width: 1920, height: 1080 },
  { name: '4K (16:9)', width: 3840, height: 2160 },
];

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

  const handlePresetChange = (presetName: string) => {
    const preset = PRESET_SIZES.find(p => p.name === presetName);
    if (preset && preset.width > 0 && preset.height > 0) {
      onExportSettingsChange({
        targetWidth: preset.width,
        targetHeight: preset.height
      });
    }
  };

  const getCurrentPreset = () => {
    const current = PRESET_SIZES.find(p => 
      p.width === exportSettings.targetWidth && p.height === exportSettings.targetHeight
    );
    return current?.name || 'Custom';
  };

  const handleQualityChange = (value: number[]) => {
    onExportSettingsChange({
      quality: value[0]
    });
  };

  const handleFormatChange = (format: 'webp' | 'jpeg' | 'png') => {
    onExportSettingsChange({ format });
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="space-y-6">
      {/* Preset Sizes */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Size Presets
        </Label>
        <Select value={getCurrentPreset()} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_SIZES.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name}
                {preset.width > 0 && (
                  <span className="text-xs text-slate-500 ml-2">
                    ({preset.width} × {preset.height})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manual Dimensions */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Custom Dimensions (px)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="target-width" className="text-xs text-slate-600">Width</Label>
            <Input
              id="target-width"
              type="number"
              value={exportSettings.targetWidth}
              onChange={(e) => handleDimensionChange('targetWidth', e.target.value)}
              onFocus={handleInputFocus}
              className="mt-1"
              min="1"
              max="4096"
            />
          </div>
          <div>
            <Label htmlFor="target-height" className="text-xs text-slate-600">Height</Label>
            <Input
              id="target-height"
              type="number"
              value={exportSettings.targetHeight}
              onChange={(e) => handleDimensionChange('targetHeight', e.target.value)}
              onFocus={handleInputFocus}
              className="mt-1"
              min="1"
              max="4096"
            />
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          This sets both the crop area size and final output dimensions
        </div>
      </div>

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
          <div>Aspect Ratio: <span className="font-medium">{(exportSettings.targetWidth / exportSettings.targetHeight).toFixed(2)}:1</span></div>
        </div>
      </div>
    </div>
  );
};
