'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brush, Eraser, Undo, Save, RotateCcw } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Label } from '@/components/ui/label';

interface DrawingCardProps {
    sourceImage: { url: string; file: File | null } | null;
    onMaskGenerated: (maskDataUrl: string) => void;
    disabled?: boolean;
    width?: number;
    isInpaintingEnabled?: boolean;  // Add this prop
}

export function DrawingCard({
    sourceImage,
    onMaskGenerated,
    disabled = false,
    width = 310,
    isInpaintingEnabled = false
}: DrawingCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [brushRadius, setBrushRadius] = useState(12);
    const [canvasSize, setCanvasSize] = useState({ width: 278, height: 278 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and initialize canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial state
        const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialState]);
    }, [sourceImage]);


    useEffect(() => {
        const updateCanvasSize = () => {
            const size = Math.min(width - 32, 278);
            setCanvasSize({ width: size, height: size });
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [width]);

    if (!isInpaintingEnabled) {
        return null;
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        setIsDrawing(true);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        
        lastPos.current = { x, y };
        draw(x, y);
    };

    const draw = (x: number, y: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || !lastPos.current) return;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? 'white' : 'black';
        ctx.lineWidth = brushRadius;
        ctx.lineCap = 'round';
        ctx.stroke();

        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            lastPos.current = null;
            
            // Save state to history
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) {
                const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory(prev => [...prev, newState]);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        
        draw(x, y);
    };

    const handleUndo = () => {
        if (history.length <= 1) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const newHistory = history.slice(0, -1);
        const lastState = newHistory[newHistory.length - 1];
        ctx.putImageData(lastState, 0, 0);
        setHistory(newHistory);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset history
        const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([newState]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        // Create a new canvas for the final mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;
    
        // Fill the mask canvas with black first (areas to preserve)
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
        // Get the current drawing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
    
        // Create mask image data where drawn areas (black pixels) become white (areas to inpaint)
        const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < data.length; i += 4) {
            // If pixel is drawn (black in our drawing)
            if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                // Make it white in the mask (area to inpaint)
                maskImageData.data[i] = 255;     // R
                maskImageData.data[i + 1] = 255; // G
                maskImageData.data[i + 2] = 255; // B
                maskImageData.data[i + 3] = 255; // A
            } else {
                // Make it black in the mask (area to preserve)
                maskImageData.data[i] = 0;     // R
                maskImageData.data[i + 1] = 0; // G
                maskImageData.data[i + 2] = 0; // B
                maskImageData.data[i + 3] = 255; // A
            }
        }
    
    // DEBUG: Display the mask
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = maskCanvas.width;
    debugCanvas.height = maskCanvas.height;
    const debugCtx = debugCanvas.getContext('2d');
    if (debugCtx) {
        debugCtx.drawImage(maskCanvas, 0, 0);
        console.log('Mask Preview:', debugCanvas.toDataURL());
    }
    
    const maskDataUrl = maskCanvas.toDataURL('image/png');
    console.log('Mask Data:', {
        size: maskDataUrl.length,
        preview: maskDataUrl.substring(0, 100) + '...',
        dimensions: `${maskCanvas.width}x${maskCanvas.height}`
    });
        onMaskGenerated(maskDataUrl);
    };

    return (
        <Card className={`w-[${width}px] ${disabled ? 'opacity-50' : ''}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brush className="w-5 h-5" />
                    Draw Mask
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {sourceImage ? (
                        <>
                            <div className="mb-4 space-y-4">
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        variant={tool === 'brush' ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => setTool('brush')}
                                        disabled={disabled}
                                        title="Brush"
                                    >
                                        <Brush className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={tool === 'eraser' ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => setTool('eraser')}
                                        disabled={disabled}
                                        title="Eraser"
                                    >
                                        <Eraser className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleUndo}
                                        disabled={disabled || history.length <= 1}
                                        title="Undo"
                                    >
                                        <Undo className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleClear}
                                        disabled={disabled}
                                        title="Clear"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={handleSave}
                                        disabled={disabled}
                                        title="Save Mask"
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Brush Size</Label>
                                    <Slider
                                        min={1}
                                        max={50}
                                        step={1}
                                        value={[brushRadius]}
                                        onValueChange={(value) => setBrushRadius(value[0])}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                            <div className="relative rounded-lg border border-gray-200 dark:border-gray-800">
                                <div 
                                    className="absolute inset-0 z-0" 
                                    style={{
                                        backgroundImage: `url(${sourceImage.url})`,
                                        backgroundSize: 'contain',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    className="relative z-10"
                                    style={{ opacity: 0.7 }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={handleMouseMove}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="h-[278px] flex items-center justify-center text-sm text-gray-500 border-2 border-dashed rounded-lg">
                            Upload an image to start drawing
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}