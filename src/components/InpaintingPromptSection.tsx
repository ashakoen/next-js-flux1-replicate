'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InpaintingPromptSectionProps {
  onPromptPrefixChange: (prefix: string) => void;
  disabled?: boolean;
  className?: string;
  value?: string;
}

export function InpaintingPromptSection({
  onPromptPrefixChange,
  disabled = false,
  className,
  value = ''
}: InpaintingPromptSectionProps) {
  return (
    <div className={cn("space-y-2 px-1", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Inpainting Focus</Label>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="ghost" size="sm">
              <InfoIcon className="h-4 w-4" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">
              Words added here will be prefixed to your main prompt during inpainting.
              This helps focus the AI on specific aspects of the image you want to modify.
            </p>
            <p className="text-sm mt-2">
              Example: &quot;detailed hands&quot; for improving hand quality in the masked area.
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <Textarea 
        placeholder="e.g. detailed hands, realistic face, natural background"
        className="h-20 resize-none"
        onChange={(e) => onPromptPrefixChange(e.target.value)}
        disabled={disabled}
        value={value}
      />
    </div>
  );
}
