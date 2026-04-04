import { deriveFibonacciTree } from '../lib/stageUtils'

const NODE_WIDTH = 84
const LEVEL_HEIGHT = 92

function FibonacciVisualizer({ visibleTrace, execution }) {
  const { nodes, leafCount } = deriveFibonacciTree(visibleTrace)
  const width = Math.max(640, leafCount * 118)
  const height =
    Math.max(
      360,
      ...nodes.map((node) => (node.depth ?? 0) * LEVEL_HEIGHT + 160),
    ) + 20

  return (
    <div className="fib-viz">
      <div className="viz-caption">
        Duplicate subproblems glow warmer to hint at repeated work in the tree.
      </div>
      <div className="tree-scroll">
        <svg
          className="fib-tree"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Fibonacci recursion tree"
        >
          {nodes.map((node) =>
            node.children.map((child) => {
              const x1 = node.layoutX * 118 + 70
              const y1 = (node.depth ?? 0) * LEVEL_HEIGHT + 72
              const x2 = child.layoutX * 118 + 70
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
            const x = node.layoutX * 118 + 28
            const y = (node.depth ?? 0) * LEVEL_HEIGHT + 28
            return (
              <g
                className={`fib-node ${node.returned ? 'returned' : 'pending'} ${
                  node.duplicate ? 'duplicate' : ''
                }`}
                key={node.id}
                transform={`translate(${x}, ${y})`}
              >
                <rect rx="18" ry="18" width={NODE_WIDTH} height="56" />
                <text x="42" y="23" textAnchor="middle">
                  fib({node.n})
                </text>
                <text x="42" y="41" textAnchor="middle">
                  {node.returned ? node.value : '...'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className={`result-pill ${execution.result != null ? 'ready' : ''}`}>
        {execution.error
          ? execution.error
          : execution.result != null
            ? `fib(6) = ${execution.result}`
            : 'Run the code to grow the recursion tree.'}
      </div>
    </div>
  )
}

export default FibonacciVisualizer
