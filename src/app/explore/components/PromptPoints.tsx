'use client'

import { useState, useEffect, useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import type { Point } from '../page'

interface PromptPointsProps {
  points: Point[]
  selectedPoint: Point | null
  onPointSelect: (point: Point | null) => void
}


export function PromptPoints({ points, selectedPoint, onPointSelect }: PromptPointsProps) {
  const [hovered, setHovered] = useState<Point | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Calculate jittered positions once when points change
  const jitteredPoints = useMemo(() => 
    points.map(point => {
      const jitter = 0.03 // Adjust this value to control spread
      return {
        ...point,
        jitteredPosition: [
          point.x * 0.5 + (Math.random() - 0.5) * jitter,
          point.y * 0.5 + (Math.random() - 0.5) * jitter,
          point.z * 0.5 + (Math.random() - 0.5) * jitter
        ]
      }
    }),
    [points]
  )

  useEffect(() => {
    if (points.length > 0) {
      setIsReady(true)
    }
  }, [points])

  if (!isReady || points.length === 0) return null

  return (
    <Instances limit={points.length + 100}>
      <sphereGeometry args={[0.03, 8, 8]} /> {/* Made spheres slightly smaller */}
      <meshBasicMaterial color="white" transparent opacity={0.8} />
      {jitteredPoints.map((point) => (
        <Instance 
          key={point.id}
          position={point.jitteredPosition as [number, number, number]}
          color={
            point.id === selectedPoint?.id 
              ? '#3b82f6'
              : point.id === hovered?.id
              ? '#60a5fa'
              : '#ffffff'
          }
          onClick={(e) => {
            e.stopPropagation()
            onPointSelect(point)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(point)
          }}
          onPointerOut={() => setHovered(null)}
        />
      ))}
    </Instances>
  )
}