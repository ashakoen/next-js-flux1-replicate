'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoIcon, Copy, MessageSquarePlus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageDescriptionSectionProps {
  description: string | null;
  onUseAsPrompt: () => void;
  className?: string;
}

export function ImageDescriptionSection({
  description,
  onUseAsPrompt,
  className
}: ImageDescriptionSectionProps) {
  if (!description) return null;

  return (
    <div className={cn("space-y-2 px-1", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Image Description</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              navigator.clipboard.writeText(description);
              toast.success('Description copied to clipboard');
            }}
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUseAsPrompt}
            title="Use as prompt"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm">
                <InfoIcon className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">
                AI-generated description of the uploaded image. You can copy it or use it as a starting point for your prompt.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <Textarea 
        value={description}
        className="h-20 resize-none"
        readOnly
      />
    </div>
  );
}
