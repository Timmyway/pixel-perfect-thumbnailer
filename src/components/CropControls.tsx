
import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CropData } from './ImageEditor';

interface CropControlsProps {
  cropData: CropData;
  onCropChange: (cropData: CropData) => void;
}

export const CropControls: React.FC<CropControlsProps> = ({
  cropData,
  onCropChange
}) => {
  const handleZoomChange = (value: number[]) => {
    onCropChange({
      ...cropData,
      zoom: value[0]
    });
  };

  const handlePositionChange = (field: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    onCropChange({
      ...cropData,
      [field]: Math.max(0, numValue)
    });
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="space-y-6">
      {/* Zoom Controls */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Zoom Level: {(cropData.zoom * 100).toFixed(0)}%
        </Label>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoomChange([Math.max(0.1, cropData.zoom - 0.1)])}
            className="p-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Slider
            value={[cropData.zoom]}
            onValueChange={handleZoomChange}
            max={3}
            min={0.1}
            step={0.1}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoomChange([Math.min(3, cropData.zoom + 0.1)])}
            className="p-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Position Controls */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Crop Position
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="crop-x" className="text-xs text-slate-600">X Position</Label>
            <Input
              id="crop-x"
              type="number"
              value={Math.round(cropData.x)}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              onFocus={handleInputFocus}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="crop-y" className="text-xs text-slate-600">Y Position</Label>
            <Input
              id="crop-y"
              type="number"
              value={Math.round(cropData.y)}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              onFocus={handleInputFocus}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Current Crop Info */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="text-xs text-slate-600">
          <div>Crop Size: <span className="font-medium">{Math.round(cropData.width)} × {Math.round(cropData.height)}</span></div>
          <div>Position: <span className="font-medium">({Math.round(cropData.x)}, {Math.round(cropData.y)})</span></div>
          <div>Zoom: <span className="font-medium">{(cropData.zoom * 100).toFixed(0)}%</span></div>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Crop size is controlled by Output Dimensions above
        </div>
      </div>
    </div>
  );
};
