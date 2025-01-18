'use client';

import { PexelsImage } from "@/types/types";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
    image: PexelsImage | null;
    onClear: () => void;
    orientation: '2:3' | '3:2';
}

export function ImagePreview({ image, onClear, orientation }: ImagePreviewProps) {
    if (!image) return null;

    return (
<Card className="relative overflow-hidden group w-[200px] mx-auto">
    <div className="h-[120px] w-full flex items-center justify-center">
        <Image
            src={image.src.small}
            alt={`Photo by ${image.photographer}`}
            width={160}  // Fixed width instead of fill
            height={120}  // Fixed height to match container
            className="object-contain"
            quality={75}
            priority
        />
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onClear}
        >
            <X className="h-4 w-4" />
        </Button>
    </div>
</Card>
    );
}