
import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
      {/* Zoom Controls Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-700">
            Zoom Level
          </Label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {(cropData.zoom * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoomChange([Math.max(0.1, cropData.zoom - 0.1)])}
            className="p-2"
            title="Zoom out"
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
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Position Controls Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
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

      <Separator />

      {/* Current Status Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Current Status
        </Label>
        <div className="p-3 bg-slate-50 rounded-lg space-y-1">
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Crop Size:</span>
            <span className="font-medium">{Math.round(cropData.width)} × {Math.round(cropData.height)}</span>
          </div>
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Position:</span>
            <span className="font-medium">({Math.round(cropData.x)}, {Math.round(cropData.y)})</span>
          </div>
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Zoom:</span>
            <span className="font-medium">{(cropData.zoom * 100).toFixed(0)}%</span>
          </div>
          <Separator className="my-2" />
          <div className="text-xs text-slate-500 text-center">
            Crop size is controlled by Output Dimensions
          </div>
        </div>
      </div>
    </div>
  );
};
