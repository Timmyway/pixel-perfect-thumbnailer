
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
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('grab');

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImagePan({ x: 0, y: 0 });
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

  // Calculate display dimensions for crop area based on target aspect ratio
  const getDisplayCropDimensions = useCallback(() => {
    if (!containerSize.width) return { width: 0, height: 0 };
    
    const targetAspectRatio = exportSettings.targetWidth / exportSettings.targetHeight;
    
    // Calculate a reasonable display size that fits in the container
    const maxDisplayWidth = containerSize.width * 0.6;
    const maxDisplayHeight = containerSize.height * 0.6;
    
    let displayWidth, displayHeight;
    
    if (maxDisplayWidth / targetAspectRatio <= maxDisplayHeight) {
      displayWidth = maxDisplayWidth;
      displayHeight = displayWidth / targetAspectRatio;
    } else {
      displayHeight = maxDisplayHeight;
      displayWidth = displayHeight * targetAspectRatio;
    }
    
    // Ensure minimum display size for usability
    const minDisplaySize = 80;
    if (displayWidth < minDisplaySize || displayHeight < minDisplaySize) {
      if (targetAspectRatio > 1) {
        displayWidth = Math.max(minDisplaySize, displayWidth);
        displayHeight = displayWidth / targetAspectRatio;
      } else {
        displayHeight = Math.max(minDisplaySize, displayHeight);
        displayWidth = displayHeight * targetAspectRatio;
      }
    }
    
    return { width: displayWidth, height: displayHeight };
  }, [containerSize, exportSettings]);

  // Update crop area when export settings change
  useEffect(() => {
    if (!containerSize.width) return;
    
    const displayDimensions = getDisplayCropDimensions();
    const centerX = (containerSize.width - displayDimensions.width) / 2;
    const centerY = (containerSize.height - displayDimensions.height) / 2;
    
    const newCropData = {
      ...cropData,
      x: centerX,
      y: centerY,
      width: displayDimensions.width,
      height: displayDimensions.height
    };

    if (Math.abs(cropData.width - displayDimensions.width) > 1 || 
        Math.abs(cropData.height - displayDimensions.height) > 1) {
      onCropChange(newCropData);
    }
  }, [exportSettings.targetWidth, exportSettings.targetHeight, containerSize]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !image || !containerSize.width) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Calculate scaled dimensions
    const scale = Math.min(
      containerWidth / image.width,
      containerHeight / image.height
    ) * cropData.zoom;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    const offsetX = (containerWidth - scaledWidth) / 2 + imagePan.x;
    const offsetY = (containerHeight - scaledHeight) / 2 + imagePan.y;

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

    // Draw corner indicators (visual only, not interactive)
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const cornerSize = 8;
    const corners = [
      { x: cropData.x, y: cropData.y },
      { x: cropData.x + cropData.width, y: cropData.y },
      { x: cropData.x, y: cropData.y + cropData.height },
      { x: cropData.x + cropData.width, y: cropData.y + cropData.height }
    ];

    corners.forEach(corner => {
      ctx.fillRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
      ctx.strokeRect(corner.x - cornerSize/2, corner.y - cornerSize/2, cornerSize, cornerSize);
    });

    // Generate cropped image
    generateCroppedImage(offsetX, offsetY, scale);
  }, [image, cropData, containerSize, imagePan]);

  const generateCroppedImage = useCallback((offsetX: number, offsetY: number, scale: number) => {
    if (!image) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Set canvas to exact target dimensions
    tempCanvas.width = exportSettings.targetWidth;
    tempCanvas.height = exportSettings.targetHeight;

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

  // Helper function to get coordinates from mouse or touch event
  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    if (
      x >= cropData.x && x <= cropData.x + cropData.width &&
      y >= cropData.y && y <= cropData.y + cropData.height
    ) {
      // Start dragging the crop area
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    } else {
      // Start panning the image
      setIsPanning(true);
      setDragStart({ x: x - imagePan.x, y: y - imagePan.y });
    }
  }, [cropData, imagePan]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isPanning) return;

    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    if (isPanning) {
      const newPanX = x - dragStart.x;
      const newPanY = y - dragStart.y;
      setImagePan({ x: newPanX, y: newPanY });
    } else if (isDragging) {
      const newX = Math.max(0, Math.min(x - dragStart.x, containerSize.width - cropData.width));
      const newY = Math.max(0, Math.min(y - dragStart.y, containerSize.height - cropData.height));
      
      onCropChange({
        ...cropData,
        x: newX,
        y: newY
      });
    }
  }, [isDragging, isPanning, dragStart, cropData, containerSize, onCropChange, imagePan]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleMouseMoveForCursor = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= cropData.x && x <= cropData.x + cropData.width &&
        y >= cropData.y && y <= cropData.y + cropData.height) {
      setCursor('move');
      return;
    }

    setCursor('grab');
  }, [cropData]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor }}
        onMouseDown={handleStart}
        onMouseMove={(e) => {
          handleMove(e);
          handleMouseMoveForCursor(e);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      />
      
      {/* Instructions overlay */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Drag crop area to position • Drag outside to pan when zoomed
      </div>
      
      {/* Dimensions display */}
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Output: {exportSettings.targetWidth} × {exportSettings.targetHeight}px
      </div>
    </div>
  );
};
