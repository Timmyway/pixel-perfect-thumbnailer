
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
    const handleSize = 12;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const handles = [
      { x: cropData.x - handleSize/2, y: cropData.y - handleSize/2 }, // top-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y - handleSize/2 }, // top-right
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }, // bottom-left
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height - handleSize/2 } // bottom-right
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
    const handleSize = 12;
    const handles = [
      { x: cropData.x - handleSize/2, y: cropData.y - handleSize/2 },
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y - handleSize/2 },
      { x: cropData.x - handleSize/2, y: cropData.y + cropData.height - handleSize/2 },
      { x: cropData.x + cropData.width - handleSize/2, y: cropData.y + cropData.height - handleSize/2 }
    ];

    return handles.findIndex(handle => 
      x >= handle.x && x <= handle.x + handleSize &&
      y >= handle.y && y <= handle.y + handleSize
    );
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing && !isPanning) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
      
      let newX = cropData.x;
      let newY = cropData.y;
      let newWidth = cropData.width;
      let newHeight = cropData.height;

      // Calculate new dimensions based on which handle is being dragged
      switch (resizeHandle) {
        case 0: // top-left
          newX = Math.max(0, cropData.x + deltaX);
          newY = Math.max(0, cropData.y + deltaY);
          newWidth = cropData.width - deltaX;
          newHeight = cropData.height - deltaY;
          break;
        case 1: // top-right
          newY = Math.max(0, cropData.y + deltaY);
          newWidth = cropData.width + deltaX;
          newHeight = cropData.height - deltaY;
          break;
        case 2: // bottom-left
          newX = Math.max(0, cropData.x + deltaX);
          newWidth = cropData.width - deltaX;
          newHeight = cropData.height + deltaY;
          break;
        case 3: // bottom-right
          newWidth = cropData.width + deltaX;
          newHeight = cropData.height + deltaY;
          break;
      }

      // Ensure minimum size and bounds
      newWidth = Math.max(50, Math.min(newWidth, containerSize.width - newX));
      newHeight = Math.max(50, Math.min(newHeight, containerSize.height - newY));

      onCropChange({
        ...cropData,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, isPanning, dragStart, cropData, containerSize, onCropChange, resizeHandle, imagePan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setResizeHandle(-1);
  }, []);

  const getCursor = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handle = getHandleAtPosition(x, y);
    if (handle !== -1) {
      const cursors = ['nw-resize', 'ne-resize', 'sw-resize', 'se-resize'];
      return cursors[handle];
    }

    if (x >= cropData.x && x <= cropData.x + cropData.width &&
        y >= cropData.y && y <= cropData.y + cropData.height) {
      return 'move';
    }

    return 'grab';
  }, [cropData]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: getCursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
