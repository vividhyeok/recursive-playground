import { deriveFactorialFrames } from '../lib/stageUtils'

function FactorialVisualizer({ visibleTrace, execution }) {
  const { frames, finalResult } = deriveFactorialFrames(visibleTrace)
  const returnedCount = frames.filter((frame) => frame.returned).length
  const deepestFrame = frames.reduce(
    (maxDepth, frame) => Math.max(maxDepth, frame.depth ?? 0),
    0,
  )

  return (
    <div className="game-viz factorial-viz">
      <div className="viz-topline">
        <div className="world-chip">STACK SHAFT</div>
        <div className="viz-mini-stats">
          <span>깊이 {deepestFrame}</span>
          <span>복귀 {returnedCount}/{frames.length}</span>
        </div>
      </div>

      <div className="viz-caption">
        호출 캡슐이 아래로 잠수하고, 반환이 일어나면 발광하며 위로 튕겨 올라옵니다.
      </div>

      <div className="factorial-world">
        <div className="factorial-rail" />

        <div className="stack-lane">
          {frames.length ? (
            frames.map((frame) => (
              <article
                className={`stack-frame ${frame.returned ? 'returned' : 'pending'}`}
                key={frame.id}
                style={{
                  '--depth': frame.depth,
                  '--hue': 208 - frame.depth * 11,
                }}
              >
                <span className="stack-depth">DEPTH 0{frame.depth}</span>
                <header>factorial({frame.n})</header>
                <p>입력 n = {frame.n}</p>
                <p>{frame.returned ? `반환값 ${frame.returnValue}` : '하강 중...'}</p>
              </article>
            ))
          ) : (
            <div className="stack-frame placeholder" style={{ '--depth': 1, '--hue': 208 }}>
              <span className="stack-depth">READY</span>
              <header>호출 캡슐 대기 중</header>
              <p>실행을 누르면 factorial(5)부터 스택이 내려갑니다.</p>
            </div>
          )}
        </div>

        <aside className="factorial-prize">
          <div className={`result-core ${finalResult != null ? 'ready' : ''}`}>
            <span>결과 코어</span>
            <strong>{finalResult ?? '?'}</strong>
          </div>
          <p>기저 조건이 닿는 순간 전체 스택이 하나의 값으로 수렴합니다.</p>
        </aside>
      </div>

      <div className={`result-pill ${finalResult != null ? 'ready' : ''}`}>
        {execution.error
          ? execution.error
          : finalResult != null
            ? `미션 성공: factorial(5) = ${finalResult}`
            : '실행하면 수직 샤프트에 호출 캡슐이 순서대로 생성됩니다.'}
      </div>
    </div>
  )
}

export default FactorialVisualizer
