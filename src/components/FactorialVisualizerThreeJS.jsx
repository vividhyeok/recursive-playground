import { useMemo } from 'react'
import { deriveFactorialFrames } from '../lib/stageUtils'

function FactorialVisualizerThreeJS({ visibleTrace }) {
  const { frames, finalResult } = useMemo(() => deriveFactorialFrames(visibleTrace), [visibleTrace])

  const viewWidth = 760
  const rowGap = 92
  const rowHeight = 56
  const topPadding = 74
  const bottomPadding = 84
  const viewHeight = Math.max(420, topPadding + bottomPadding + Math.max(0, frames.length - 1) * rowGap)

  const callX = 180
  const resultX = 580
  const callBoxWidth = 168
  const resultBoxWidth = 172
  const callLabelY = topPadding - 28
  const totalRows = frames.length

  return (
    <div className="factorial-plan-view" style={{ height: '100%', width: '100%' }}>
      <svg
        className="factorial-plan-svg"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="팩토리얼 재귀 호출과 곱셈 반환 흐름"
      >
        <defs>
          <marker
            id="arrow-head"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
          <marker
            id="arrow-head-blue"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
          <linearGradient id="call-box" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="result-box" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>

        <rect x="18" y="18" width={viewWidth - 36} height={viewHeight - 36} rx="22" fill="#f8fbff" stroke="#dbe4f0" />
        <text x={viewWidth / 2} y="44" textAnchor="middle" className="factorial-plan-title">
          재귀 호출은 아래로, 반환은 곱셈으로 올라옵니다
        </text>
        <text x="34" y="58" className="factorial-lane-label">
          호출 스택
        </text>
        <text x={viewWidth - 164} y="58" className="factorial-lane-label">
          반환 / 곱셈
        </text>

        <line
          x1={callX + callBoxWidth / 2}
          y1={callLabelY + 18}
          x2={callX + callBoxWidth / 2}
          y2={viewHeight - bottomPadding}
          stroke="#cbd5e1"
          strokeDasharray="6 8"
          strokeWidth="2"
        />
        <line
          x1={resultX + resultBoxWidth / 2}
          y1={callLabelY + 18}
          x2={resultX + resultBoxWidth / 2}
          y2={viewHeight - bottomPadding}
          stroke="#cbd5e1"
          strokeDasharray="6 8"
          strokeWidth="2"
        />

        {frames.map((frame, index) => {
          const y = topPadding + index * rowGap
          const isTail = index === totalRows - 1
          const childReturn = frames[index + 1]?.returnValue
          const returnedText = frame.returned ? frame.returnValue : '대기 중'
          const formulaText = frame.returned
            ? isTail
              ? '= 1'
              : childReturn != null
                ? `= ${frame.n} × ${childReturn}`
                : `= ${frame.n} × ...`
            : `= ${frame.n} × ...`

          return (
            <g key={frame.id}>
              <rect
                x={callX}
                y={y}
                width={callBoxWidth}
                height={rowHeight}
                rx="16"
                fill="url(#call-box)"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.96"
              />
              <text x={callX + callBoxWidth / 2} y={y + 23} textAnchor="middle" className="factorial-box-title">
                factorial({frame.n})
              </text>
              <text x={callX + callBoxWidth / 2} y={y + 41} textAnchor="middle" className="factorial-box-subtitle">
                호출 깊이 {frame.depth}
              </text>

              <line
                x1={callX + callBoxWidth / 2}
                y1={y + rowHeight}
                x2={callX + callBoxWidth / 2}
                y2={y + rowGap - 10}
                stroke="#64748b"
                strokeWidth="2.5"
                markerEnd="url(#arrow-head)"
              />
              {!isTail && (
                <text x={callX + callBoxWidth / 2 + 12} y={y + rowGap / 2 + 6} className="factorial-arrow-label">
                  n - 1
                </text>
              )}

              <path
                d={`M ${callX + callBoxWidth} ${y + 28} C ${callX + callBoxWidth + 44} ${y + 28}, ${resultX - 42} ${y + 28}, ${resultX} ${y + 28}`}
                fill="none"
                stroke={frame.returned ? '#2563eb' : '#94a3b8'}
                strokeWidth="3"
                markerEnd="url(#arrow-head-blue)"
                strokeDasharray={frame.returned ? '0' : '7 7'}
              />
              <text
                x={(callX + callBoxWidth + resultX) / 2}
                y={y + 20}
                textAnchor="middle"
                className="factorial-formula"
              >
                {formulaText}
              </text>

              <rect
                x={resultX}
                y={y}
                width={resultBoxWidth}
                height={rowHeight}
                rx="16"
                fill="url(#result-box)"
                stroke={frame.returned ? '#60a5fa' : '#334155'}
                strokeWidth="2"
              />
              <text x={resultX + resultBoxWidth / 2} y={y + 23} textAnchor="middle" className="factorial-box-title">
                반환
              </text>
              <text x={resultX + resultBoxWidth / 2} y={y + 41} textAnchor="middle" className="factorial-box-subtitle">
                {returnedText}
              </text>
            </g>
          )
        })}

        <text x="34" y={viewHeight - 30} className="factorial-footer-note">
          결과: factorial(5) = {finalResult ?? '...'}
        </text>
      </svg>
    </div>
  )
}

export default FactorialVisualizerThreeJS
