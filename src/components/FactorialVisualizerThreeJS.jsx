import React, { useMemo } from 'react'
import { deriveFactorialFrames } from '../lib/stageUtils'

export default function FactorialVisualizerThreeJS({ visibleTrace }) {
  const { frames } = useMemo(() => deriveFactorialFrames(visibleTrace), [visibleTrace])

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height: '100%', overflowY: 'auto' }}>
      <h3 style={{color: '#666', marginBottom: 20}}>연쇄 곱셈 반환 (팩토리얼)</h3>
      {frames.length === 0 && <div style={{ color: '#aaa' }}>대기 중...</div>}
      
      {frames.map((frame, i) => {
        const isLatest = i === frames.length - 1 && !frame.returned
        
        let expression = ''
        if (frame.returned) {
          expression = `${frame.returnValue}`
        } else if (frames[i + 1]) {
          const child = frames[i + 1]
          if (child.returned) {
            expression = `${frame.n} × ${child.returnValue}`
          } else {
            expression = `${frame.n} × factorial(${frame.n - 1})`
          }
        } else {
          expression = `${frame.n} × factorial(${frame.n - 1})`
        }

        // Special case for base case (like n=1 returning 1)
        if (frame.returned && (!frames[i+1]) && frame.n === 1) {
             expression = `1`
        }

        return (
          <div 
            key={String(frame.depth) + String(frame.n)} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              padding: '12px 24px', 
              background: frame.returned ? '#dafbe1' : (isLatest ? '#f4f7f9' : '#ffffff'),
              border: frame.returned ? '2px solid #4ac26b' : (isLatest ? '2px solid #4c97ff' : '2px solid #d1d9e0'),
              color: '#333', 
              borderRadius: 8,
              boxShadow: isLatest ? '0 4px 12px rgba(76, 151, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: 450,
              justifyContent: 'space-between',
              animation: 'slide-in 0.2s ease-out'
            }}
          >
            <span style={{ color: '#666', flex: 1, textAlign: 'left' }}>factorial({frame.n})</span>
            <span style={{ color: '#aaa', padding: '0 10px' }}>{frame.returned ? '→' : '='}</span>
            <span style={{ color: frame.returned ? '#1a7f37' : '#4c97ff', flex: 1, textAlign: 'right' }}>{expression}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
