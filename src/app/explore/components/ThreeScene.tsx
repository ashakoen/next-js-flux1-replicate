'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import { PromptPoints } from './PromptPoints'
import type { Point } from '../page'

interface ThreeSceneProps {
  points: Point[]
  selectedPoint: Point | null
  onPointSelect: (point: Point | null) => void
}

export default function ThreeScene({ points, selectedPoint, onPointSelect }: ThreeSceneProps) {
  useEffect(() => {
    console.log('ThreeScene points:', points.length)
  }, [points])

  return (
    <Canvas>
      <color attach="background" args={['#000']} />
      <PerspectiveCamera makeDefault position={[0, 0, 50]} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        rotateSpeed={0.2}
        zoomSpeed={0.3}
        panSpeed={0.3}
      />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {points.length > 0 && (
        <Suspense fallback={null}>
          <PromptPoints 
            points={points}
            onPointSelect={onPointSelect}
            selectedPoint={selectedPoint}
          />
        </Suspense>
      )}
    </Canvas>
  )
}