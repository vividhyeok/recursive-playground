import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import BlocklyEditor from './components/BlocklyEditor.jsx'
import FactorialVisualizer from './components/FactorialVisualizer.jsx'
import FibonacciVisualizer from './components/FibonacciVisualizer.jsx'
import HanoiVisualizer from './components/HanoiVisualizer.jsx'
import { STAGES, STAGE_ORDER, getInitialStage, isStageUnlocked } from './data/stages'
import { runStudentCode } from './lib/pyodideRunner'
import { persistStageCode, persistStageCompletion, readStoredProgress } from './lib/storage'
import { simulateHanoi } from './lib/stageUtils'

function buildWorkspaceState(storedProgress) {
  return Object.fromEntries(
    Object.entries(STAGES).map(([stageKey, stage]) => [
      stageKey,
      stage.parseToWorkspace(storedProgress[stageKey].code) ?? stage.defaultWorkspace(),
    ]),
  )
}

function buildCodeState(storedProgress) {
  return Object.fromEntries(
    Object.entries(storedProgress).map(([stageKey, data]) => [stageKey, data.code]),
  )
}

function buildCompletionState(storedProgress) {
  return Object.fromEntries(
    Object.entries(storedProgress).map(([stageKey, data]) => [stageKey, data.complete]),
  )
}

function createEmptyExecution() {
  return {
    trace: [],
    result: null,
    error: null,
    playhead: 0,
    isPlaying: false,
    codeSnapshot: '',
    executionId: 0,
  }
}

function buildExecutionState() {
  return Object.fromEntries(STAGE_ORDER.map((stageKey) => [stageKey, createEmptyExecution()]))
}

function summarizeTrace(events) {
  return events.reduce(
    (summary, event) => {
      if (event.type === 'call') {
        summary.calls += 1
        summary.maxDepth = Math.max(summary.maxDepth, Number(event.depth) || 0)
      } else if (event.type === 'return') {
        summary.returns += 1
      } else if (event.type === 'move') {
        summary.moves += 1
      }

      return summary
    },
    {
      calls: 0,
      returns: 0,
      moves: 0,
      maxDepth: 0,
    },
  )
}

function formatEventLabel(event) {
  if (event.type === 'call') {
    const args = Object.entries(event.args ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')
    return `${event.func}(${args}) 진입`
  }

  if (event.type === 'return') {
    return `${event.func} 반환값 ${event.value}`
  }

  return `원반 이동 ${event.from} → ${event.to}`
}

function StageVisualization({ stageKey, execution, speed }) {
  const visibleTrace = execution.trace.slice(0, execution.playhead)

  if (stageKey === 'stage1') {
    return <FactorialVisualizer execution={execution} visibleTrace={visibleTrace} />
  }

  if (stageKey === 'stage2') {
    return <FibonacciVisualizer execution={execution} visibleTrace={visibleTrace} />
  }

  return (
    <HanoiVisualizer
      executionId={execution.executionId}
      fullTrace={visibleTrace}
      moveDuration={Math.max(360, 1100 / speed)}
      visibleTrace={visibleTrace}
    />
  )
}

function App() {
  const storedProgress = useMemo(() => readStoredProgress(STAGES), [])
  const initialCompletion = useMemo(() => buildCompletionState(storedProgress), [storedProgress])
  const [codes, setCodes] = useState(() => buildCodeState(storedProgress))
  const [workspaceStates, setWorkspaceStates] = useState(() => buildWorkspaceState(storedProgress))
  const [completion, setCompletion] = useState(initialCompletion)
  const [activeStageKey, setActiveStageKey] = useState(() => getInitialStage(initialCompletion))
  const [editorMode, setEditorMode] = useState('blocks')
  const [executions, setExecutions] = useState(buildExecutionState)
  const [speed, setSpeed] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [pythonWarning, setPythonWarning] = useState('')
  const [hasBooted, setHasBooted] = useState(false)
  const [showBriefing, setShowBriefing] = useState(false)
  const executeStageRef = useRef(null)
  const handleStepRef = useRef(null)

  const activeStage = STAGES[activeStageKey]
  const activeExecution = executions[activeStageKey]
  const activeCode = codes[activeStageKey]
  const visibleTrace = useMemo(
    () => activeExecution.trace.slice(0, activeExecution.playhead),
    [activeExecution.playhead, activeExecution.trace],
  )
  const telemetry = useMemo(() => summarizeTrace(visibleTrace), [visibleTrace])
  const recentEvents = useMemo(() => visibleTrace.slice(-6).reverse(), [visibleTrace])
  const visiblePegs = useMemo(
    () => (activeStageKey === 'stage3' ? simulateHanoi(visibleTrace) : null),
    [activeStageKey, visibleTrace],
  )
  const runDelay =
    activeStageKey === 'stage3' ? Math.max(420, 1300 / speed) : Math.max(260, 760 / speed)
  const isRunStale = activeExecution.codeSnapshot !== activeCode

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      Object.entries(codes).forEach(([stageKey, code]) => {
        persistStageCode(stageKey, code)
      })
    }, 280)

    return () => window.clearTimeout(timeout)
  }, [codes])

  useEffect(() => {
    Object.entries(completion).forEach(([stageKey, done]) => {
      persistStageCompletion(stageKey, done)
    })
  }, [completion])

  useEffect(() => {
    if (!activeExecution.isPlaying) {
      return undefined
    }

    if (activeExecution.playhead >= activeExecution.trace.length) {
      setExecutions((current) => ({
        ...current,
        [activeStageKey]: {
          ...current[activeStageKey],
          isPlaying: false,
        },
      }))
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setExecutions((current) => ({
        ...current,
        [activeStageKey]: {
          ...current[activeStageKey],
          playhead: Math.min(
            current[activeStageKey].playhead + 1,
            current[activeStageKey].trace.length,
          ),
        },
      }))
    }, runDelay)

    return () => window.clearTimeout(timeout)
  }, [
    activeExecution.isPlaying,
    activeExecution.playhead,
    activeExecution.trace.length,
    activeStageKey,
    runDelay,
  ])

  useEffect(() => {
    setExecutions((current) => ({
      ...current,
      [activeStageKey]: {
        ...current[activeStageKey],
        isPlaying: false,
      },
    }))
    setStatusMessage(activeStage.readyMessage)
    setPythonWarning('')
  }, [activeStage, activeStageKey])

  useEffect(() => {
    executeStageRef.current = executeStage
    handleStepRef.current = handleStep
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!hasBooted && event.key === 'Enter') {
        event.preventDefault()
        setHasBooted(true)
        return
      }

      if (!hasBooted) {
        return
      }

      const target = event.target
      const tagName = target instanceof HTMLElement ? target.tagName : ''
      const isTypingTarget =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (isTypingTarget) {
        return
      }

      if (event.key === 'Enter' && !isRunning) {
        event.preventDefault()
        executeStageRef.current?.({ autoPlay: true })
      }

      if (event.key === ' ' && !isRunning) {
        event.preventDefault()
        handleStepRef.current?.()
      }

      if (event.key === '1') {
        setEditorMode('blocks')
      }

      if (event.key === '2') {
        setEditorMode('python')
      }

      if (event.key.toLowerCase() === 'b') {
        setShowBriefing((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasBooted, isRunning])

  const unlockedStages = useMemo(
    () =>
      Object.fromEntries(
        STAGE_ORDER.map((stageKey) => [stageKey, isStageUnlocked(stageKey, completion)]),
      ),
    [completion],
  )

  async function executeStage({ autoPlay }) {
    const stage = STAGES[activeStageKey]
    setIsRunning(true)
    setStatusMessage('파이썬 엔진을 깨우고 재귀 흔적을 추적하는 중입니다...')

    try {
      const payload = await runStudentCode(stage, activeCode)
      const pegs = stage.key === 'stage3' ? simulateHanoi(payload.trace) : null
      const stagePassed =
        !payload.error &&
        stage.validate({
          result: payload.result,
          trace: payload.trace,
          pegs,
        })

      setExecutions((current) => ({
        ...current,
        [activeStageKey]: {
          trace: payload.trace,
          result: payload.result,
          error: payload.error,
          playhead: autoPlay ? 0 : Math.min(1, payload.trace.length),
          isPlaying: autoPlay && !payload.error && payload.trace.length > 0,
          codeSnapshot: activeCode,
          executionId: current[activeStageKey].executionId + 1,
        },
      }))

      if (payload.error) {
        setStatusMessage(payload.error)
        return
      }

      if (stagePassed) {
        setCompletion((current) => ({
          ...current,
          [activeStageKey]: true,
        }))
        setStatusMessage(stage.successMessage)
      } else if (stage.key === 'stage3') {
        setStatusMessage('의식은 재생됐지만 아직 모든 원반이 C 기둥에 모이지 않았습니다.')
      } else {
        setStatusMessage('흐름은 재생됐지만 목표 결과가 아직 맞지 않습니다.')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '파이썬 엔진을 불러오거나 코드를 실행하지 못했습니다.'
      setStatusMessage(message)
      setExecutions((current) => ({
        ...current,
        [activeStageKey]: {
          ...createEmptyExecution(),
          codeSnapshot: activeCode,
          executionId: current[activeStageKey].executionId + 1,
          error: message,
        },
      }))
    } finally {
      setIsRunning(false)
    }
  }

  function handleWorkspaceChange({ workspaceData, code }) {
    setCodes((current) => ({
      ...current,
      [activeStageKey]: code,
    }))
    setWorkspaceStates((current) => ({
      ...current,
      [activeStageKey]: workspaceData,
    }))
    setPythonWarning('')
  }

  function handlePythonChange(value) {
    setCodes((current) => ({
      ...current,
      [activeStageKey]: value,
    }))

    const parsedWorkspace = activeStage.parseToWorkspace(value)
    if (parsedWorkspace) {
      setWorkspaceStates((current) => ({
        ...current,
        [activeStageKey]: parsedWorkspace,
      }))
      setPythonWarning('')
      return
    }

    setPythonWarning(
      '파이썬 코드는 업데이트됐지만 Blockly 모양으로는 완전히 되돌리지 못했습니다. 텍스트 실행은 계속 가능합니다.',
    )
  }

  function handleStep() {
    if (!activeExecution.trace.length || isRunStale) {
      executeStage({ autoPlay: false })
      return
    }

    setExecutions((current) => ({
      ...current,
      [activeStageKey]: {
        ...current[activeStageKey],
        isPlaying: false,
        playhead: Math.min(
          current[activeStageKey].playhead + 1,
          current[activeStageKey].trace.length,
        ),
      },
    }))
  }

  const progressCount = Object.values(completion).filter(Boolean).length
  const progressLabel = completion.stage3 ? '모든 구역 정복 완료' : `${progressCount}/3 구역 정복`

  return (
    <div className={`shell stage-${activeStageKey} ${hasBooted ? 'booted' : 'boot-waiting'}`}>
      {!hasBooted ? (
        <section className="boot-overlay" aria-label="게임 시작 화면">
          <p className="eyebrow">RECURSIVE TRAINING SIM</p>
          <h2>Recursive Playground</h2>
          <p>코드로 월드를 움직이는 훈련을 시작하세요.</p>
          <button onClick={() => setHasBooted(true)} type="button">
            PRESS START
          </button>
          <small>Enter 키로도 시작할 수 있습니다.</small>
        </section>
      ) : null}

      <div className="shell-backdrop">
        <span className="backdrop-orb orb-a" />
        <span className="backdrop-orb orb-b" />
        <span className="backdrop-orb orb-c" />
        <span className="scan-lines" />
      </div>

      <header className="command-bar">
        <div className="brand-panel">
          <p className="eyebrow">재귀 훈련 아레나</p>
          <h1>Recursive Playground</h1>
          <p className="lede">
            웹페이지가 아니라, 코드-아레나 플레이 화면입니다.
          </p>
        </div>

        <div className="status-hud">
          <div className="hud-unit">
            <span>현재 구역</span>
            <strong>{activeStage.worldName}</strong>
          </div>
          <div className="hud-unit">
            <span>미션 상태</span>
            <strong>{progressLabel}</strong>
          </div>
          <div className="hud-unit">
            <span>입력 방식</span>
            <strong>{editorMode === 'blocks' ? '블록 코딩' : '파이썬 코드'}</strong>
          </div>
          <div className="hud-unit">
            <span>난이도</span>
            <strong>{activeStage.difficulty}</strong>
          </div>
          <button
            className="briefing-toggle"
            onClick={() => setShowBriefing((current) => !current)}
            type="button"
          >
            {showBriefing ? '브리핑 닫기 (B)' : '브리핑 열기 (B)'}
          </button>
        </div>
      </header>

      {showBriefing ? (
        <section className="mission-rack">
        <nav className="stage-tabs" aria-label="단계 선택">
          {STAGE_ORDER.map((stageKey) => {
            const stage = STAGES[stageKey]
            const unlocked = unlockedStages[stageKey]
            const active = stageKey === activeStageKey
            return (
              <button
                className={`stage-tab ${active ? 'active' : ''}`}
                disabled={!unlocked}
                key={stageKey}
                onClick={() => {
                  if (unlocked) {
                    setActiveStageKey(stageKey)
                  }
                }}
                type="button"
              >
                <span className="stage-index">STAGE {stage.number}</span>
                <strong>{stage.shortLabel}</strong>
                <em>{stage.worldName}</em>
                <small>
                  {completion[stageKey] ? '완료' : unlocked ? '해금됨' : '잠김'}
                </small>
              </button>
            )
          })}
        </nav>

        <section className="mission-panel">
          <div className="mission-panel-top">
            <div>
              <p className="eyebrow">현재 미션</p>
              <h2>{activeStage.missionName}</h2>
              <p>{activeStage.subtitle}</p>
            </div>
            <div className="difficulty-pill">{activeStage.difficulty}</div>
          </div>

          <div className="mission-grid">
            <article className="mission-card">
              <span className="brief-tag">핵심 개념</span>
              <p>{activeStage.concept}</p>
            </article>
            <article className="mission-card">
              <span className="brief-tag">목표</span>
              <p>{activeStage.objective}</p>
            </article>
            <article className="mission-card">
              <span className="brief-tag">입력 힌트</span>
              <p>{activeStage.modeHint}</p>
            </article>
          </div>
        </section>
      </section>
      ) : null}

      <main className="game-board">
        <section className="panel console-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">코드 콘솔</p>
              <h2>{activeStage.title}</h2>
              <p>
                {editorMode === 'blocks'
                  ? '블록을 조립해 월드 규칙을 만드세요.'
                  : '파이썬을 직접 수정해 월드 규칙을 만드세요.'}
              </p>
            </div>

            <div className="mode-cluster">
              <span className="mode-label">입력 방식 선택</span>
              <div className="mode-toggle" role="tablist" aria-label="코드 입력 방식">
                <button
                  className={editorMode === 'blocks' ? 'selected' : ''}
                  onClick={() => setEditorMode('blocks')}
                  type="button"
                >
                  블록 코딩
                </button>
                <button
                  className={editorMode === 'python' ? 'selected' : ''}
                  onClick={() => setEditorMode('python')}
                  type="button"
                >
                  파이썬 코드
                </button>
              </div>
            </div>
          </div>

          <div className="editor-frame">
            {editorMode === 'blocks' ? (
              <BlocklyEditor
                key={`${activeStageKey}-blocks`}
                onWorkspaceChange={handleWorkspaceChange}
                stage={activeStage}
                workspaceData={workspaceStates[activeStageKey]}
              />
            ) : (
              <textarea
                aria-label={`${activeStage.title} 파이썬 편집기`}
                className="python-editor"
                onChange={(event) => handlePythonChange(event.target.value)}
                spellCheck={false}
                value={activeCode}
              />
            )}
          </div>

          <div className="control-deck">
            <button
              className="primary"
              disabled={isRunning}
              onClick={() => executeStage({ autoPlay: true })}
              type="button"
            >
              {isRunning ? '추적 중...' : '실행'}
            </button>
            <button className="secondary" disabled={isRunning} onClick={handleStep} type="button">
              한 단계
            </button>
            <div className="shortcut-hint">Enter 실행 | Space 한 단계 | 1/2 모드 전환</div>
            <label className="speed-control">
              <span>재생 속도</span>
              <input
                max="2"
                min="0.6"
                onChange={(event) => setSpeed(Number(event.target.value))}
                step="0.1"
                type="range"
                value={speed}
              />
              <strong>{speed.toFixed(1)}x</strong>
            </label>
          </div>

          <div className={`status-card ${activeExecution.error ? 'error' : ''}`}>
            <strong>상태</strong>
            <p>{statusMessage || activeStage.readyMessage}</p>
            {pythonWarning ? <p className="warning">{pythonWarning}</p> : null}
            {isRunStale && activeExecution.trace.length ? (
              <p className="warning">
                마지막 추적 이후 코드가 바뀌었습니다. 실행을 다시 눌러 월드를 새로 생성하세요.
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel arena-panel">
          <div className="panel-head arena-head">
            <div>
              <p className="panel-kicker">플레이 아레나</p>
              <h2>{activeStage.arenaName}</h2>
              <p>재귀 호출의 시간순 흔적이 게임 월드 안에서 재생됩니다.</p>
            </div>

            <div className="arena-readouts">
              <div className="hud-unit small">
                <span>재생 이벤트</span>
                <strong>
                  {activeExecution.playhead}/{activeExecution.trace.length}
                </strong>
              </div>
              <div className="hud-unit small">
                <span>최대 깊이</span>
                <strong>{telemetry.maxDepth}</strong>
              </div>
              <div className="hud-unit small">
                <span>이동 수</span>
                <strong>{telemetry.moves}</strong>
              </div>
            </div>
          </div>

          <div className="visual-frame">
            <StageVisualization execution={activeExecution} speed={speed} stageKey={activeStageKey} />
          </div>

          <div className="telemetry-strip">
            <div className="telemetry-card">
              <span>호출 수</span>
              <strong>{telemetry.calls}</strong>
            </div>
            <div className="telemetry-card">
              <span>반환 수</span>
              <strong>{telemetry.returns}</strong>
            </div>
            <div className="telemetry-card">
              <span>현재 결과</span>
              <strong>
                {activeStageKey === 'stage3'
                  ? `${visiblePegs?.C.length ?? 0}/3 도착`
                  : activeExecution.result ?? '대기 중'}
              </strong>
            </div>
            <div className="telemetry-card">
              <span>세계 상태</span>
              <strong>{completion[activeStageKey] ? '클리어' : '진행 중'}</strong>
            </div>
          </div>

          <section className="event-feed-panel">
            <div className="event-feed-header">
              <h3>실시간 로그</h3>
              <span>{recentEvents.length ? '최신 6개 이벤트' : '대기 중'}</span>
            </div>

            <div className="event-feed-list">
              {recentEvents.length ? (
                recentEvents.map((event, index) => (
                  <article className={`feed-entry ${event.type}`} key={`${event.type}-${index}`}>
                    <strong>
                      {event.type === 'call'
                        ? 'CALL'
                        : event.type === 'return'
                          ? 'RETURN'
                          : 'MOVE'}
                    </strong>
                    <p>{formatEventLabel(event)}</p>
                  </article>
                ))
              ) : (
                <article className="feed-entry empty">
                  <strong>WAIT</strong>
                  <p>아직 재생된 이벤트가 없습니다. 코드를 실행하면 로그가 순서대로 쌓입니다.</p>
                </article>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
