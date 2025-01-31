'use client'

import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { SearchBar } from './components/SearchBar'
import { PromptDetails } from './components/PromptDetails'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Card } from '@/components/ui/card'

// Dynamically import Three.js components to avoid SSR issues
const ThreeScene = dynamic(() => import('./components/ThreeScene'), { 
  ssr: false,
  loading: () => <LoadingSpinner /> 
})


export interface Point {
  id: string
  x: number
  y: number
  z: number
  prompt_embedding: {
    id: string
    prompt: string
    telemetry: {
      generation_parameters: any
    }
  }
}

export default function ExplorePage() {
  const [points, setPoints] = useState<Point[]>([])
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [loading, setLoading] = useState(true)

// Remove supabase client initialization
useEffect(() => {
  async function fetchPoints() {
    try {
      const response = await fetch('/api/explore/points')
      if (!response.ok) throw new Error('Failed to fetch points')
      const data = await response.json()
      setPoints(data)
    } catch (error) {
      console.error('Error fetching points:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchPoints()
}, [])

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm: query,
          apiKey: localStorage.getItem('replicateApiKey')
        })
      })

      if (!response.ok) throw new Error('Search failed')
      const { prompts } = await response.json()
      
      // Find the point corresponding to the most similar prompt
      if (prompts.length > 0) {
        const matchingPoint = points.find(p => 
          p.prompt_embedding.prompt === prompts[0].prompt
        )
        if (matchingPoint) {
          setSelectedPoint(matchingPoint)
          // TODO: Animate camera to this point
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  return (
    <div className="w-full h-screen flex bg-background">
      <Card className="flex-1 relative m-4 overflow-hidden">
        <SearchBar onSearch={handleSearch} />
        
        <ThreeScene 
          points={points}
          selectedPoint={selectedPoint}
          onPointSelect={setSelectedPoint}
        />

        {loading && <LoadingSpinner />}
      </Card>

      {selectedPoint && (
        <PromptDetails 
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onGenerateNear={() => {
            // TODO: Implement generate near functionality
            // This should use the existing generation logic from page.tsx
          }}
        />
      )}
    </div>
  )
}