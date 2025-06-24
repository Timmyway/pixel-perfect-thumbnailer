
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings, Crop } from 'lucide-react';
import { CropControls } from './CropControls';
import { ExportControls } from './ExportControls';
import { CropData, ExportSettings } from './ImageEditor';

interface TabControlsProps {
  cropData: CropData;
  onCropChange: (cropData: CropData) => void;
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: Partial<ExportSettings>) => void;
}

export const TabControls: React.FC<TabControlsProps> = ({
  cropData,
  onCropChange,
  exportSettings,
  onExportSettingsChange
}) => {
  return (
    <Tabs defaultValue="output" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="output" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Output Settings
        </TabsTrigger>
        <TabsTrigger value="crop" className="flex items-center gap-2">
          <Crop className="w-4 h-4" />
          Crop Controls
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="output" className="mt-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Export Configuration</h4>
          <ExportControls
            exportSettings={exportSettings}
            onExportSettingsChange={onExportSettingsChange}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="crop" className="mt-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Image Positioning</h4>
          <CropControls
            cropData={cropData}
            onCropChange={onCropChange}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};
