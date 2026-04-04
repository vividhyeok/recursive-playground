import { deriveFibonacciTree } from '../lib/stageUtils'

const NODE_WIDTH = 94
const LEVEL_HEIGHT = 104

function FibonacciVisualizer({ visibleTrace, execution }) {
  const { nodes, leafCount } = deriveFibonacciTree(visibleTrace)
  const width = Math.max(640, leafCount * 126)
  const height =
    Math.max(
      380,
      ...nodes.map((node) => (node.depth ?? 0) * LEVEL_HEIGHT + 170),
    ) + 24
  const duplicateCount = nodes.filter((node) => node.duplicate).length
  const returnedCount = nodes.filter((node) => node.returned).length

  return (
    <div className="game-viz fib-viz">
      <div className="viz-topline">
        <div className="world-chip">BRANCH FOREST</div>
        <div className="viz-mini-stats">
          <span>노드 {nodes.length}</span>
          <span>중복 {duplicateCount}</span>
          <span>해결 {returnedCount}</span>
        </div>
      </div>

      <div className="viz-caption">
        같은 숫자를 다시 계산하는 노드는 더 뜨겁게 빛나며, 이진 재귀의 낭비를 그대로 드러냅니다.
      </div>

      <div className="fib-world">
        <div className="fib-orb fib-orb-a" />
        <div className="fib-orb fib-orb-b" />
        <div className="tree-scroll">
          <svg
            className="fib-tree"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="피보나치 재귀 트리"
          >
            {nodes.map((node) =>
              node.children.map((child) => {
                const x1 = node.layoutX * 126 + 78
                const y1 = (node.depth ?? 0) * LEVEL_HEIGHT + 72
                const x2 = child.layoutX * 126 + 78
                const y2 = (child.depth ?? 0) * LEVEL_HEIGHT + 72

                return (
                  <line
                    className="fib-edge"
                    key={`${node.id}-${child.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                  />
                )
              }),
            )}

            {nodes.map((node) => {
              const x = node.layoutX * 126 + 31
              const y = (node.depth ?? 0) * LEVEL_HEIGHT + 34

              return (
                <g
                  className={`fib-node ${node.returned ? 'returned' : 'pending'} ${
                    node.duplicate ? 'duplicate' : ''
                  }`}
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                >
                  <rect rx="24" ry="24" width={NODE_WIDTH} height="62" />
                  <text x="47" y="25" textAnchor="middle">
                    fib({node.n})
                  </text>
                  <text x="47" y="46" textAnchor="middle">
                    {node.returned ? node.value : '...'}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className={`result-pill ${execution.result != null ? 'ready' : ''}`}>
        {execution.error
          ? execution.error
          : execution.result != null
            ? `미션 성공: fib(6) = ${execution.result}`
            : '실행하면 재귀 가지가 자라나며 호출 숲이 생성됩니다.'}
      </div>
    </div>
  )
}

export default FibonacciVisualizer
