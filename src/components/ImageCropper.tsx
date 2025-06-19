
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
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(-1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('grab');

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Reset pan when new image is loaded
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

  // Calculate display dimensions for crop area based on target dimensions
  const getDisplayCropDimensions = useCallback(() => {
    if (!containerSize.width) return { width: 0, height: 0 };
    
    const targetAspectRatio = exportSettings.targetWidth / exportSettings.targetHeight;
    
    // Calculate a reasonable display size that fits in the container
    // but represents the target dimensions proportionally
    let displayWidth, displayHeight;
    
    const maxDisplayWidth = containerSize.width * 0.7;
    const maxDisplayHeight = containerSize.height * 0.7;
    
    // Scale based on which dimension would be the limiting factor
    if (maxDisplayWidth / targetAspectRatio <= maxDisplayHeight) {
      // Width constrained
      displayWidth = maxDisplayWidth;
      displayHeight = displayWidth / targetAspectRatio;
    } else {
      // Height constrained
      displayHeight = maxDisplayHeight;
      displayWidth = displayHeight * targetAspectRatio;
    }
    
    // Ensure minimum display size for usability
    const minDisplaySize = 60;
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
    
    // Only update if dimensions actually changed to avoid infinite loops
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

    // Draw resize handles
    const isMobile = 'ontouchstart' in window;
    const handleSize = isMobile ? 20 : 12;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const handles = [
      // Corner handles
      { x: cropData.x - handleSize/2, y: cropData.y - handleSize/2 }, // top-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y - handleSize/2 }, // top-right
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }, // bottom-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }, // bottom-right
      // Edge handles
      { x: cropData.x + cropData.width/2 - handleSize/2, y: cropData.y - handleSize/2 }, // top
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height/2 - handleSize/2 }, // right
      { x: cropData.x + cropData.width/2 - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }, // bottom
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height/2 - handleSize/2 } // left
    ];

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
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

  const getHandleAtPosition = (x: number, y: number) => {
    const isMobile = 'ontouchstart' in window;
    const handleSize = isMobile ? 20 : 12;
    const handles = [
      // Corner handles
      { x: cropData.x - handleSize/2, y: cropData.y - handleSize/2, cursor: 'nw-resize' }, // 0: top-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y - handleSize/2, cursor: 'ne-resize' }, // 1: top-right
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height - handleSize/2, cursor: 'sw-resize' }, // 2: bottom-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height - handleSize/2, cursor: 'se-resize' }, // 3: bottom-right
      // Edge handles
      { x: cropData.x + cropData.width/2 - handleSize/2, y: cropData.y - handleSize/2, cursor: 'n-resize' }, // 4: top
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height/2 - handleSize/2, cursor: 'e-resize' }, // 5: right
      { x: cropData.x + cropData.width/2 - handleSize/2, y: cropData.y + cropData.height - handleSize/2, cursor: 's-resize' }, // 6: bottom
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height/2 - handleSize/2, cursor: 'w-resize' } // 7: left
    ];

    return handles.findIndex(handle => 
      x >= handle.x && x <= handle.x + handleSize &&
      y >= handle.y && y <= handle.y + handleSize
    );
  };

  // Helper function to get coordinates from mouse or touch event
  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    const clickedHandle = getHandleAtPosition(x, y);

    if (clickedHandle !== -1) {
      setIsResizing(true);
      setResizeHandle(clickedHandle);
      setDragStart({ x, y });
    } else if (
      x >= cropData.x && x <= cropData.x + cropData.width &&
      y >= cropData.y && y <= cropData.y + cropData.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    } else {
      // Start panning the image
      setIsPanning(true);
      setDragStart({ x: x - imagePan.x, y: y - imagePan.y });
    }
  }, [cropData, imagePan]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isResizing && !isPanning) return;

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
    } else if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const targetAspectRatio = exportSettings.targetWidth / exportSettings.targetHeight;
      const minDisplaySize = 30; // Reduced minimum for better precision
      
      let newX = cropData.x;
      let newY = cropData.y;
      let newWidth = cropData.width;
      let newHeight = cropData.height;

      // Slower, more precise resizing with reduced delta sensitivity
      const sensitivity = 0.5;
      const adjustedDeltaX = deltaX * sensitivity;
      const adjustedDeltaY = deltaY * sensitivity;

      // Calculate new dimensions based on which handle is being dragged
      // but maintain aspect ratio
      switch (resizeHandle) {
        case 0: // top-left corner
          newWidth = Math.max(minDisplaySize, cropData.width - adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          newX = cropData.x + cropData.width - newWidth;
          newY = cropData.y + cropData.height - newHeight;
          break;
        case 1: // top-right corner
          newWidth = Math.max(minDisplaySize, cropData.width + adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          newY = cropData.y + cropData.height - newHeight;
          break;
        case 2: // bottom-left corner
          newWidth = Math.max(minDisplaySize, cropData.width - adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          newX = cropData.x + cropData.width - newWidth;
          break;
        case 3: // bottom-right corner
          newWidth = Math.max(minDisplaySize, cropData.width + adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          break;
        case 4: // top edge
          newHeight = Math.max(minDisplaySize / targetAspectRatio, cropData.height - adjustedDeltaY);
          newWidth = newHeight * targetAspectRatio;
          newX = cropData.x + (cropData.width - newWidth) / 2;
          newY = cropData.y + cropData.height - newHeight;
          break;
        case 5: // right edge
          newWidth = Math.max(minDisplaySize, cropData.width + adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          newY = cropData.y + (cropData.height - newHeight) / 2;
          break;
        case 6: // bottom edge
          newHeight = Math.max(minDisplaySize / targetAspectRatio, cropData.height + adjustedDeltaY);
          newWidth = newHeight * targetAspectRatio;
          newX = cropData.x + (cropData.width - newWidth) / 2;
          break;
        case 7: // left edge
          newWidth = Math.max(minDisplaySize, cropData.width - adjustedDeltaX);
          newHeight = newWidth / targetAspectRatio;
          newX = cropData.x + cropData.width - newWidth;
          newY = cropData.y + (cropData.height - newHeight) / 2;
          break;
      }

      // Ensure crop area stays within container bounds
      newX = Math.max(0, Math.min(newX, containerSize.width - newWidth));
      newY = Math.max(0, Math.min(newY, containerSize.height - newHeight));
      
      // Adjust dimensions if they would exceed container bounds
      if (newX + newWidth > containerSize.width) {
        newWidth = containerSize.width - newX;
        newHeight = newWidth / targetAspectRatio;
      }
      if (newY + newHeight > containerSize.height) {
        newHeight = containerSize.height - newY;
        newWidth = newHeight * targetAspectRatio;
      }

      onCropChange({
        ...cropData,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, isPanning, dragStart, cropData, containerSize, onCropChange, resizeHandle, imagePan, exportSettings]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setResizeHandle(-1);
  }, []);

  const handleMouseMoveForCursor = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handle = getHandleAtPosition(x, y);
    if (handle !== -1) {
      const cursors = [
        'nw-resize', 'ne-resize', 'sw-resize', 'se-resize', // corners
        'n-resize', 'e-resize', 's-resize', 'w-resize' // edges
      ];
      setCursor(cursors[handle]);
      return;
    }

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
        // Mouse events
        onMouseDown={handleStart}
        onMouseMove={(e) => {
          handleMove(e);
          handleMouseMoveForCursor(e);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        // Touch events for mobile
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      />
    </div>
  );
};
