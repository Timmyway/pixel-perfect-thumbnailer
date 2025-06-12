
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CropData, ExportSettings } from './ImageEditor';

interface ImageCropperProps {
  imageUrl: string;
  cropData: CropData;
  onCropChange: (cropData: CropData) => void;
  exportSettings: ExportSettings;
  onCroppedImageUpdate: (croppedImage: string) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  cropData,
  onCropChange,
  exportSettings,
  onCroppedImageUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update container size
  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Update crop dimensions when export settings change
  useEffect(() => {
    if (cropData.width !== exportSettings.targetWidth || cropData.height !== exportSettings.targetHeight) {
      onCropChange({
        ...cropData,
        width: exportSettings.targetWidth,
        height: exportSettings.targetHeight
      });
    }
  }, [exportSettings.targetWidth, exportSettings.targetHeight]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !image || !containerSize.width) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Calculate scaled dimensions
    const scale = Math.min(
      containerWidth / image.width,
      containerHeight / image.height
    ) * cropData.zoom;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Draw image
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropData.x, cropData.y, cropData.width, cropData.height);

    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropData.x, cropData.y, cropData.width, cropData.height);

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cropData.x - handleSize/2, cropData.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropData.x + cropData.width - handleSize/2, cropData.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropData.x - handleSize/2, cropData.y + cropData.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropData.x + cropData.width - handleSize/2, cropData.y + cropData.height - handleSize/2, handleSize, handleSize);

    // Generate cropped image
    generateCroppedImage();
  }, [image, cropData, containerSize]);

  const generateCroppedImage = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Set canvas to exact target dimensions
    tempCanvas.width = exportSettings.targetWidth;
    tempCanvas.height = exportSettings.targetHeight;

    const container = containerRef.current!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scale = Math.min(
      containerWidth / image.width,
      containerHeight / image.height
    ) * cropData.zoom;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    // Calculate source coordinates on the original image
    const sourceX = Math.max(0, (cropData.x - offsetX) / scale);
    const sourceY = Math.max(0, (cropData.y - offsetY) / scale);
    const sourceWidth = Math.min(cropData.width / scale, image.width - sourceX);
    const sourceHeight = Math.min(cropData.height / scale, image.height - sourceY);

    // Draw the cropped portion to fill the entire target canvas
    tempCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      exportSettings.targetWidth,
      exportSettings.targetHeight
    );

    const quality = exportSettings.format === 'png' ? undefined : exportSettings.quality;
    const mimeType = `image/${exportSettings.format}`;
    const dataUrl = tempCanvas.toDataURL(mimeType, quality);
    onCroppedImageUpdate(dataUrl);
  }, [image, cropData, exportSettings, onCroppedImageUpdate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handleSize = 8;
    const handles = [
      { x: cropData.x - handleSize/2, y: cropData.y - handleSize/2 },
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y - handleSize/2 },
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height - handleSize/2 },
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }
    ];

    const clickedHandle = handles.findIndex(handle => 
      x >= handle.x && x <= handle.x + handleSize &&
      y >= handle.y && y <= handle.y + handleSize
    );

    if (clickedHandle !== -1) {
      setIsResizing(true);
      setDragStart({ x, y });
    } else if (
      x >= cropData.x && x <= cropData.x + cropData.width &&
      y >= cropData.y && y <= cropData.y + cropData.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    }
  }, [cropData]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(x - dragStart.x, containerSize.width - cropData.width));
      const newY = Math.max(0, Math.min(y - dragStart.y, containerSize.height - cropData.height));
      
      onCropChange({
        ...cropData,
        x: newX,
        y: newY
      });
    }
    // Note: Resizing is disabled since crop size is now controlled by output dimensions
  }, [isDragging, isResizing, dragStart, cropData, containerSize, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
