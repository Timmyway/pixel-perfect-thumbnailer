
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

  const handleSizeChange = (field: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 50;
    onCropChange({
      ...cropData,
      [field]: Math.max(50, numValue)
    });
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
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Size Controls */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Crop Size
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="crop-width" className="text-xs text-slate-600">Width</Label>
            <Input
              id="crop-width"
              type="number"
              value={Math.round(cropData.width)}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="crop-height" className="text-xs text-slate-600">Height</Label>
            <Input
              id="crop-height"
              type="number"
              value={Math.round(cropData.height)}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
