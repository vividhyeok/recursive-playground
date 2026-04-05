import React from 'react'

export default function QuadtreeVisualizer({ visibleTrace }) {
  const calls = visibleTrace.filter(t => t.type === 'call' && t.func === 'quadtree')
  
  // Find the last active call to highlight it
  let activeStack = []
  for (const t of visibleTrace) {
    if (t.type === 'call') activeStack.push(t)
    else if (t.type === 'return') activeStack.pop()
  }
  const activeCall = activeStack.length > 0 ? activeStack[activeStack.length - 1] : null

  // Canvas size mappings. The code uses size 16. We scale it up by 20.
  const SCALE = 20
  const FULL_SIZE = 16 * SCALE

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h3 style={{color: '#666', marginBottom: 20}}>Quadtree 시각화 (색종이 분할)</h3>
      <svg width={FULL_SIZE} height={FULL_SIZE} style={{ background: '#fff', border: '2px solid #ccc', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        {calls.map((call, i) => {
          const { x, y, size } = call.args
          const scaledX = Number(x) * SCALE
          const scaledY = Number(y) * SCALE
          const scaledSize = Number(size) * SCALE
          const isActive = activeCall && activeCall.args.x === x && activeCall.args.y === y && activeCall.args.size === size
          
          return (
            <g key={i}>
              <rect
                x={scaledX}
                y={scaledY}
                width={scaledSize}
                height={scaledSize}
                fill={isActive ? 'rgba(76, 151, 255, 0.4)' : 'transparent'}
                stroke={isActive ? '#3373cc' : 'rgba(0, 0, 0, 0.15)'}
                strokeWidth={isActive ? 3 : 1}
              />
              {isActive && (
                <text x={scaledX + 5} y={scaledY + 15} fontSize="10" fill="#333" fontWeight="bold">
                  {`size: ${size}`}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
