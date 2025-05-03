import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Move, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface ProfilePictureEditorProps {
  imageUrl: string;
  onSave: (croppedImageData: string) => void;
  onCancel: () => void;
}

const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  imageUrl,
  onSave,
  onCancel
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize the image when it loads
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      // Reset position and zoom when a new image is loaded
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageUrl]);
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Implement boundaries to prevent dragging too far
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const scaledImageWidth = imageRef.current.width * zoom;
      const scaledImageHeight = imageRef.current.height * zoom;
      
      // Calculate max drag distance
      const maxX = Math.max(0, (scaledImageWidth - container.width) / 2);
      const maxY = Math.max(0, (scaledImageHeight - container.height) / 2);
      
      // Clamp the position values
      const clampedX = Math.min(Math.max(newX, -maxX), maxX);
      const clampedY = Math.min(Math.max(newY, -maxY), maxY);
      
      setPosition({
        x: clampedX,
        y: clampedY
      });
    }
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle reset
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle save - crop the image based on current view
  const handleSave = () => {
    if (!imageRef.current || !containerRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    
    const container = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setIsLoading(false);
      return;
    }
    
    // Set canvas size to match the crop area (always a circle/square for profile pictures)
    const size = Math.min(container.width, container.height);
    canvas.width = size;
    canvas.height = size;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Calculate the crop area in the original image
    const scaledImageWidth = imageRef.current.naturalWidth * zoom;
    const scaledImageHeight = imageRef.current.naturalHeight * zoom;
    
    // Center of the container
    const centerX = container.width / 2;
    const centerY = container.height / 2;
    
    // Calculate the drawing parameters
    const sx = (scaledImageWidth / 2 - centerX - position.x) / zoom;
    const sy = (scaledImageHeight / 2 - centerY - position.y) / zoom;
    const sWidth = size / zoom;
    const sHeight = size / zoom;
    
    // Draw the image on the canvas
    ctx.drawImage(
      imageRef.current,
      sx, sy, sWidth, sHeight,
      0, 0, size, size
    );
    
    // Get the data URL of the cropped image
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Call the onSave callback with the cropped image data
    onSave(croppedImageData);
    setIsLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Edit Profile Picture</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div 
            ref={containerRef}
            className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-2 border-gray-300 mb-4"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              ref={imageRef}
              src={imageUrl}
              alt="Profile"
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-move"
              style={{
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                maxWidth: 'none',
                maxHeight: 'none'
              }}
              draggable={false}
            />
            
            {/* Drag indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <Move size={32} className="text-white drop-shadow-lg" />
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button 
              onClick={handleZoomOut}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={20} className="text-gray-700" />
            </button>
            
            <button 
              onClick={handleReset}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Reset"
            >
              <RefreshCw size={20} className="text-gray-700" />
            </button>
            
            <button 
              onClick={handleZoomIn}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={20} className="text-gray-700" />
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-4 text-center">
            Drag to reposition. Use the controls to zoom and adjust.
          </p>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" /> 
                Processing...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" /> 
                Save
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default ProfilePictureEditor; 