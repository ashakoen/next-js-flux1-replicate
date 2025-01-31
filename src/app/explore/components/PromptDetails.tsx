'use client'

import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Point } from '../page'

interface PromptDetailsProps {
  point: Point
  onClose: () => void
  onGenerateNear: () => void
}

export function PromptDetails({ point, onClose, onGenerateNear }: PromptDetailsProps) {
  const prompt = point.prompt_embedding.prompt
  const params = point.prompt_embedding.telemetry?.generation_parameters

  return (
    <Card className="w-96 h-full m-4 p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Prompt Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Prompt</h3>
          <p className="text-sm">{prompt}</p>
        </div>

        {params && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Parameters</h3>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(params, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <Button 
        className="mt-6 w-full" 
        onClick={onGenerateNear}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Near This
      </Button>
    </Card>
  )
}