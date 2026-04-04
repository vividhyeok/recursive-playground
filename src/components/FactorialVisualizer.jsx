import { deriveFactorialFrames } from '../lib/stageUtils'

function FactorialVisualizer({ visibleTrace, execution }) {
  const { frames, finalResult } = deriveFactorialFrames(visibleTrace)

  return (
    <div className="factorial-viz">
      <div className="viz-caption">
        Frames drop downward as calls are made, then brighten as values climb back up.
      </div>
      <div className="stack-lane">
        {frames.map((frame) => (
          <article
            className={`stack-frame ${frame.returned ? 'returned' : 'pending'}`}
            key={frame.id}
            style={{
              '--depth': frame.depth,
              '--hue': 220 - frame.depth * 12,
            }}
          >
            <header>factorial({frame.n})</header>
            <p>n = {frame.n}</p>
            <p>{frame.returned ? `returns ${frame.returnValue}` : 'waiting...'}</p>
          </article>
        ))}
      </div>
      <div className={`result-pill ${finalResult != null ? 'ready' : ''}`}>
        {execution.error
          ? execution.error
          : finalResult != null
            ? `factorial(5) = ${finalResult}`
            : 'Run the code to fill the stack.'}
      </div>
    </div>
  )
}

export default FactorialVisualizer
