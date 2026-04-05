import React from 'react'

export default function CountdownVisualizer({ visibleTrace }) {
  const calls = visibleTrace.filter(t => t.type === 'call')
  const returns = visibleTrace.filter(t => t.type === 'return')
  
  // Calculate active stack by matching calls and returns
  let activeStack = []
  for (const t of visibleTrace) {
    if (t.type === 'call') {
      activeStack.push(t)
    } else if (t.type === 'return') {
      activeStack.pop()
    }
  }

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 10, height: '100%', justifyContent: 'flex-end' }}>
      <h3 style={{color: '#666', marginBottom: 20}}>Call Stack (카운트다운)</h3>
      {activeStack.map((call, i) => (
        <div 
          key={i} 
          style={{
            padding: '15px 40px', 
            background: i === activeStack.length - 1 ? '#4cbf56' : '#4c97ff', 
            color: 'white', 
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            animation: 'slide-up 0.2s ease-out'
          }}
        >
          {`countdown(${call.args.n})`}
        </div>
      ))}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
