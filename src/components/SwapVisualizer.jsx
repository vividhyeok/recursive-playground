import React from 'react'

export default function SwapVisualizer({ visibleTrace }) {
  // Initial array state for the visualizer
  let arr = ['A', 'B', 'C', 'D', 'E']
  
  let activeCall = null
  for (const t of visibleTrace) {
    if (t.type === 'swap') {
      const { left, right } = t
      const temp = arr[left]
      arr[left] = arr[right]
      arr[right] = temp
    } else if (t.type === 'call') {
      activeCall = t
    } else if (t.type === 'return') {
      activeCall = null
    }
  }

  // Find the active pointers
  const leftPointer = activeCall ? Number(activeCall.args.left) : -1
  const rightPointer = activeCall ? Number(activeCall.args.right) : -1

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h3 style={{color: '#666', marginBottom: 40}}>Array / String Swap</h3>
      <div style={{ display: 'flex', gap: 15 }}>
        {arr.map((char, index) => {
          const isLeft = index === leftPointer
          const isRight = index === rightPointer
          const isActive = isLeft || isRight
          
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{
                  width: 60, 
                  height: 60, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: isActive ? '#fff' : '#f4f7f9',
                  border: isActive ? '3px solid #ffbf00' : '2px solid #cfd8dc',
                  borderRadius: 12,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  boxShadow: isActive ? '0 8px 16px rgba(255, 191, 0, 0.3)' : 'none',
                  color: '#333',
                  transition: 'all 0.3s'
                }}
              >
                {char}
              </div>
              <div style={{ height: 30, marginTop: 10, fontWeight: 'bold' }}>
                {isLeft && <span style={{color: '#4c97ff'}}>L포인터 ▲</span>}
                {isRight && <span style={{color: '#ff6680'}}>R포인터 ▲</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
