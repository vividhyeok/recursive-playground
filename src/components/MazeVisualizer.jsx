import React from 'react'

const MAZE_SIZE = 5
const WALLS = [
  '0,1', '1,1', '1,3', '2,3', '3,1', '4,3'
]

export default function MazeVisualizer({ visibleTrace }) {
  let activeStack = []
  for (const t of visibleTrace) {
    if (t.type === 'call') {
      activeStack.push(t)
    } else if (t.type === 'return') {
      activeStack.pop()
    }
  }

  const pathCoords = activeStack.map(call => `${call.args.x},${call.args.y}`)
  const currentCoord = pathCoords[pathCoords.length - 1]

  const grid = []
  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      const coord = `${x},${y}`
      const isWall = WALLS.includes(coord)
      const isExit = x === 4 && y === 4
      const isPath = pathCoords.includes(coord)
      const isCurrent = currentCoord === coord
      
      let background = '#fff'
      if (isWall) background = '#cfd8dc'
      else if (isCurrent) background = '#ffbf00'
      else if (isPath) background = '#ffdca8'
      else if (isExit) background = '#4cbf56'

      grid.push(
        <div key={coord} style={{
          width: 50,
          height: 50,
          background,
          border: '1px solid #e9eef2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}>
          {isCurrent ? '🐭' : (isExit && !isCurrent ? '🧀' : '')}
        </div>
      )
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h3 style={{color: '#666', marginBottom: 20}}>DFS 백트래킹 (미로 쥐)</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${MAZE_SIZE}, 50px)`,
        gridGap: 2,
        background: '#cfd8dc',
        border: '4px solid #cfd8dc',
        borderRadius: 8,
        padding: 4
      }}>
        {grid}
      </div>
    </div>
  )
}
