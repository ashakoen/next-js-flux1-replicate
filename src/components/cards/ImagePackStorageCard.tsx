'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Package, Wand2, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface StoredImagePack {
  url: string;
  prompt: string;
  timestamp: string;
  seed: number;
  model: string;
  imageUrl: string;
  version?: string;
  privateLoraName?: string;
  lora_scale?: number;
  extra_lora?: string;
  extra_lora_scale?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  go_fast?: boolean;
  output_format?: string;
  output_quality?: number;
  disable_safety_checker?: boolean;
  style?: string;
  isImg2Img?: boolean;
  prompt_strength?: number;
  generationType?: 'txt2img' | 'img2img' | 'inpainting';
  aspect_ratio?: string;
}

interface ImagePackStorageCardProps {
  storedPacks: StoredImagePack[];
  onGeneratePack: (url: string) => Promise<void>;
  onDeletePack: (url: string) => Promise<void>;
  className?: string;
}

export function ImagePackStorageCard({ storedPacks, onGeneratePack, onDeletePack, className }: ImagePackStorageCardProps) {
  return (
    <Card className={`flex flex-col w-full mt-4 ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stored Image Packs
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {storedPacks.length} packs
        </span>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {storedPacks.length > 0 ? (
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-2 gap-1 sm:gap-2 auto-rows-fr">
              <AnimatePresence mode="popLayout">
                {storedPacks.map((pack) => (
                  <motion.div
                    key={pack.url}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group aspect-square w-full"
                  >
                    <Image
                      src={pack.imageUrl}
                      alt={pack.prompt}
                      fill
                      className="rounded-lg object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6 sm:h-8 sm:w-8"
                              onClick={() => onGeneratePack(pack.url)}
                            >
                              <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 sm:h-8 sm:w-8"
                              onClick={() => onDeletePack(pack.url)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="font-medium truncate">{pack.prompt}</p>
                          <p className="text-xs text-muted-foreground">Model: {pack.model}</p>
                          <p className="text-xs text-muted-foreground">Seed: {pack.seed}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No stored image packs</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
