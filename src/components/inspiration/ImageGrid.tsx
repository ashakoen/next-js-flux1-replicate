'use client';

import { PexelsImage } from "@/types/types";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface ImageGridProps {
    images: PexelsImage[];
    isLoading: boolean;
    onSelect: (image: PexelsImage) => void;
}

export function ImageGrid({ images, isLoading, onSelect }: ImageGridProps) {
    return (
<div className="relative w-full">
    {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )}
    
    <div className="grid grid-cols-3 gap-6 w-full">  {/* Adjusted gap and removed lg:grid-cols-4 */}
        {images.map((image) => (
            <div
                key={image.id}
                className="relative aspect-[3/2] overflow-hidden rounded-lg border border-muted 
                    hover:border-primary cursor-pointer transition-all duration-200 
                    hover:shadow-lg hover:scale-[1.02]"
                onClick={() => onSelect(image)}
            >
                <Image
                    src={image.src.large}  // Changed from small to medium for better quality
                    alt={`Photo by ${image.photographer}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 800px) 33vw, 250px" 
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <p className="absolute bottom-2 left-2 text-xs text-white">
                        by {image.photographer}
                    </p>
                </div>
            </div>
        ))}
    </div>
</div>
    );
}