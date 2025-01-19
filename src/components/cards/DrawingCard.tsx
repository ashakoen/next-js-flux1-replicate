'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brush, Undo, Save, RotateCcw } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Label } from '@/components/ui/label';

interface DrawingCardProps {
    sourceImage: { url: string; file: File | null } | null;
    onMaskGenerated: (maskDataUrl: string) => void;
    disabled?: boolean;
    width?: number;
    isInpaintingEnabled?: boolean;
    currentMaskDataUrl?: string | null;
}

export function DrawingCard({
    sourceImage,
    onMaskGenerated,
    disabled = false,
    width = 370,
    isInpaintingEnabled = false,
    currentMaskDataUrl = null
}: DrawingCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [brushRadius, setBrushRadius] = useState(12);
    const [canvasSize, setCanvasSize] = useState({ width: 278, height: 278 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const [imageHeight, setImageHeight] = useState<number>(0);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize with black (areas to preserve)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // If we have an existing mask, load it
        if (currentMaskDataUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Save this state to history
                const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([initialState]);
            };
            img.src = currentMaskDataUrl;
        } else {
            // Save initial black state to history
            const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([initialState]);
        }
    }, [sourceImage, currentMaskDataUrl]);

    useEffect(() => {
        const updateCanvasSize = () => {
            const size = Math.min(width - 32, 278);
            setCanvasSize({ width: size, height: size });
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [width]);

    useEffect(() => {
        if (sourceImage?.url) {
            const img = new Image();
            img.onload = () => {
                // Calculate size maintaining aspect ratio
                const aspectRatio = img.height / img.width;
                const maxWidth = width - 32; // Account for padding/margins
                const calculatedHeight = maxWidth * aspectRatio;
                
                setCanvasSize({ 
                    width: Math.round(maxWidth), 
                    height: Math.round(calculatedHeight) 
                });
            };
            img.src = sourceImage.url;
        }
    }, [sourceImage, width]);

    if (!isInpaintingEnabled) {
        return null;
    }

    // Add imageHeight + extra space for controls
    const cardHeight = imageHeight + 200; // 150px for controls and padding

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        setIsDrawing(true);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

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
        ctx.strokeStyle = 'white';  // areas to inpaint
        ctx.lineWidth = brushRadius;
        ctx.lineCap = 'round';
        ctx.stroke();
    
        // Debug: Verify pixel color after drawing
        const imageData = ctx.getImageData(x - 1, y - 1, 3, 3);
        const hasWhite = Array.from(imageData.data).some((value, index) => index % 4 === 0 && value === 255);
        //console.log('White pixels detected in drawn area:', hasWhite);
    
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
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

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

        ctx.fillStyle = 'black';
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
    
        // Debug: Check mask data before saving
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let whitePixels = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 255) { // Check red channel
                whitePixels++;
            }
        }
        console.log(`Mask contains ${whitePixels} pixels to inpaint`);
    
        // If no white pixels found, something might be wrong
        if (whitePixels === 0) {
            console.warn('Warning: No white pixels found in mask!');
        }
    
        const maskDataUrl = canvas.toDataURL('image/png');
        
        // Debug: Log the first part of the data URL
        //console.log('Mask data URL preview:', maskDataUrl.substring(0, 100));
    
        onMaskGenerated(maskDataUrl);
    };

    return (
<Card className={`flex flex-col w-full relative overflow-auto ${disabled ? 'opacity-50' : ''}`}>
    <CardHeader className="p-3">
        <CardTitle className="flex items-center gap-2 text-sm">
            <Brush className="w-5 h-5" />
            Draw Mask
        </CardTitle>
    </CardHeader>
    <CardContent className="flex-1 overflow-y-auto p-2 pr-6">
                <div className="flex flex-col h-full">
                    {sourceImage ? (
                        <>
                            <div className="mb-2 space-y-2">
                                <div className="flex gap-1 justify-center">
                                    <Button
                                        variant={tool === 'brush' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTool('brush')}
                                        disabled={disabled}
                                        title="Brush"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Brush className="w-3 h-3" />
                                    </Button>
                                    {/* Removed Eraser Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUndo}
                                        disabled={disabled || history.length <= 1}
                                        title="Undo"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Undo className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClear}
                                        disabled={disabled}
                                        title="Clear"
                                        className="h-7 w-7 p-0"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={disabled}
                                        title="Save Mask"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Save className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Brush Size</Label>
                                    <Slider
                                        min={1}
                                        max={50}
                                        step={1}
                                        value={[brushRadius]}
                                        onValueChange={(value) => setBrushRadius(value[0])}
                                        disabled={disabled}
                                        className="py-0"
                                    />
                                </div>
                            </div>
                            <div className="relative flex-1 rounded-lg border border-gray-200 dark:border-gray-800">
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
                                    className="relative z-10 w-full h-full"
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
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed rounded-lg">
                            Upload an image to start drawing
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}