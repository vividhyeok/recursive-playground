import React, { useMemo } from 'react'
import { deriveHanoiCallStack, simulateHanoi } from '../lib/stageUtils'

export default function HanoiVisualizer({ visibleTrace }) {
  const diskCount = 3
  const pegs = useMemo(() => simulateHanoi(visibleTrace, diskCount), [visibleTrace, diskCount])
  const activeStack = useMemo(() => deriveHanoiCallStack(visibleTrace), [visibleTrace])

  const moveCount = useMemo(
    () => visibleTrace.filter((event) => event.type === 'move').length,
    [visibleTrace],
  )

  const pegLabels = ['A', 'B', 'C']

  const getDiskWidth = (diskSize) => {
    const widths = { 1: 70, 2: 130, 3: 180 }
    return widths[diskSize] ?? 180
  }

  const getDiskColor = (diskSize) => {
    const colors = { 1: '#4c97ff', 2: '#ffbf00', 3: '#ff6680' }
    return colors[diskSize] ?? '#4cbf56'
  }

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box', display: 'flex', gap: 24, height: '100%', background: '#ffffff', overflow: 'hidden' }}>
<div style={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <h3 style={{ color: '#333', margin: '0 0 4px 0', fontSize: '1rem' }}>하노이 탑 이동 보드</h3>
        <p style={{ color: '#888', marginBottom: 12, fontSize: '0.85rem' }}>현재까지 총 <strong style={{color:'#333'}}>{moveCount}</strong>번 이동</p>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 44, borderBottom: '4px solid #e9eef2', position: 'relative', minHeight: 0 }}>
          {pegLabels.map((peg) => (
            <div key={peg} style={{ position: 'relative', width: 200, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              {/* 기둥 막대기 */}
              <div style={{ position: 'absolute', bottom: 0, width: 16, height: '65%', background: '#e9eef2', borderRadius: '8px 8px 0 0', zIndex: 0 }} />
              
              {/* 기둥에 쌓인 원판들 */}
              <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', zIndex: 1, width: '100%' }}>
                {pegs[peg].map((diskSize) => (
                  <div 
                    key={diskSize}
                    style={{
                      width: getDiskWidth(diskSize),
                      height: 40,
                      background: getDiskColor(diskSize),
                      borderRadius: 8,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      transition: 'all 0.15s ease-out'
                    }}
                  >
                    {diskSize}
                  </div>
                ))}
              </div>
              
              {/* 바닥 기둥 이름표 */}
              <div style={{ position: 'absolute', bottom: -35, fontWeight: 'bold', fontSize: '1.2rem', color: '#666', padding: '4px 12px', background: '#f4f7f9', borderRadius: 8, border: '1px solid #d1d9e0', whiteSpace: 'nowrap' }}>
                기둥 {peg}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 진행 상황 패널 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, borderLeft: '1px solid #e9eef2', paddingLeft: 30 }}>
        
        {/* 기둥 별 현재 상태 요약 */}
        <div>
           <h4 style={{color: '#333'}}>현재 기둥 상태</h4>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
             {pegLabels.map(peg => (
               <div key={`state-${peg}`} style={{ padding: '10px 15px', background: peg === 'C' ? '#dafbe1' : '#f4f7f9', borderRadius: 8, border: peg === 'C' ? '1px solid #4ac26b' : '1px solid #d1d9e0', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <strong>기둥 {peg}</strong>
                 <div style={{ display: 'flex', gap: 6 }}>
                    {pegs[peg].length > 0 ? (
                        pegs[peg].map(d => (
                            <span key={`${peg}-${d}`} style={{ background: getDiskColor(d), color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 'bold' }}>{d}</span>
                        ))
                    ) : (
                        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>비어 있음</span>
                    )}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* 연쇄 호출 스택 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            활성화된 스택
            <span style={{ background: '#e9eef2', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', color: '#666' }}>{activeStack.length} 호출</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, overflowY: 'auto', flex: 1, paddingRight: 10 }}>
            {activeStack.length === 0 && <div style={{color: '#aaa', padding: 20, textAlign: 'center', background: '#f9f9f9', borderRadius: 8}}>현재 실행 중인 함수가 없습니다.</div>}
            
            {activeStack.map((call, i) => (
              <div 
                key={call.id}
                style={{
                  padding: '12px 15px',
                  background: i === activeStack.length - 1 ? '#e1ecff' : '#ffffff',
                  border: i === activeStack.length - 1 ? '2px solid #4c97ff' : '1px solid #d1d9e0',
                  borderRadius: 8,
                  color: '#333',
                  boxShadow: i === activeStack.length - 1 ? '0 4px 12px rgba(76, 151, 255, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: '1.05rem', color: i === activeStack.length - 1 ? '#1f6feb' : '#333' }}>hanoi({call.n})</strong>
                </div>
                <div style={{fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: 6}}>
                   <span style={{ background: '#f4f7f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #e9eef2' }}>{call.fromPeg}</span>
                   <span style={{ color: '#aaa' }}>→</span>
                   <span style={{ background: '#f4f7f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #e9eef2' }}>{call.toPeg}</span>
                   <span style={{ color: '#aaa', marginLeft: 4 }}>(보조: {call.auxPeg})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>
  )
}
