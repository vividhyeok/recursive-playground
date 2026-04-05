import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import BlocklyEditor from './components/BlocklyEditor.jsx'
import FactorialVisualizerThreeJS from './components/FactorialVisualizerThreeJS.jsx'
import FibonacciVisualizer from './components/FibonacciVisualizer.jsx'
import HanoiVisualizer from './components/HanoiVisualizer.jsx'
import CountdownVisualizer from './components/CountdownVisualizer.jsx'
import QuadtreeVisualizer from './components/QuadtreeVisualizer.jsx'
import SwapVisualizer from './components/SwapVisualizer.jsx'
import MazeVisualizer from './components/MazeVisualizer.jsx'
import PythonEditor from './components/PythonEditor.jsx'
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
      }

      return summary
    },
    {
      calls: 0,
      returns: 0,
      maxDepth: 0,
    },
  )
}

function StageVisualization({ stageKey, execution, speed }) {
  const visibleTrace = execution.trace.slice(0, execution.playhead)

  if (stageKey === 'stage1') return <CountdownVisualizer visibleTrace={visibleTrace} />
  if (stageKey === 'stage2') return <FactorialVisualizerThreeJS execution={execution} visibleTrace={visibleTrace} />
  if (stageKey === 'stage3') return <QuadtreeVisualizer visibleTrace={visibleTrace} />
  if (stageKey === 'stage4') return <SwapVisualizer visibleTrace={visibleTrace} />
  if (stageKey === 'stage5') return <MazeVisualizer visibleTrace={visibleTrace} />
  if (stageKey === 'stage6') {
    return (
      <HanoiVisualizer
        executionId={execution.executionId}
        fullTrace={visibleTrace}
        moveDuration={Math.max(360, 1100 / speed)}
        visibleTrace={visibleTrace}
      />
    )
  }
  return null
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
  const [hintCounts, setHintCounts] = useState({})
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
      if (activeExecution.error) {
        setStatusMessage(`오류로 중단됨: ${activeExecution.error}`)
      }
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning])

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
      const pegs = stage.key === 'stage6' ? simulateHanoi(payload.trace, 3) : null
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
          isPlaying: autoPlay && payload.trace.length > 0,
          codeSnapshot: activeCode,
          executionId: current[activeStageKey].executionId + 1,
        },
      }))

      if (payload.error) {
        if (autoPlay && payload.trace.length > 0) {
          setStatusMessage('오답입니다. 에러 발생 전까지의 과정을 재생합니다...')
        } else {
          setStatusMessage(payload.error)
        }
        return
      }

      if (stagePassed) {
        setCompletion((current) => ({
          ...current,
          [activeStageKey]: true,
        }))
        setStatusMessage(stage.successMessage)
      } else if (stage.key === 'stage6') {
        setStatusMessage('하노이 시뮬레이션은 재생됐지만, 아직 모든 원반이 C 기둥에 모이지 않았습니다.')
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

  function handleStop() {
    setExecutions((current) => ({
      ...current,
      [activeStageKey]: {
        ...current[activeStageKey],
        isPlaying: false,
        playhead: 0,
      },
    }))
    setStatusMessage(activeStage.readyMessage)
  }

  const progressCount = Object.values(completion).filter(Boolean).length
  const progressLabel = progressCount === STAGE_ORDER.length ? '모든 구역 정복 완료' : `${progressCount}/${STAGE_ORDER.length} 구역 정복`

  return (
    <div className={`ide-layout stage-${activeStageKey}`}>
      <header className="ide-header glass-panel">
        <div className="brand-title">Recursive Playground</div>
        <nav className="stage-selector" aria-label="단계 선택">
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
                Stage {stage.number}: {stage.shortLabel}
              </button>
            )
          })}
        </nav>
        <div className="header-status">
          <span className="progress-badge">{progressLabel}</span>
        </div>
      </header>

      <main className="ide-main">
        {/* Left Pane: Game/Preview */}
        <section className="game-pane window-panel">
          <header className="pane-header">
            <div className="title-group">
              <h2>{activeStage.arenaName}</h2>
              <span className="subtitle">{activeStage.missionName}</span>
            </div>
            <div className="telemetry-bar">
              <span className="metric">깊이 {telemetry.maxDepth}</span>
              <span className="metric">이동 {telemetry.moves}</span>
              <span className="metric">호출 {telemetry.calls}</span>
              <span className="metric">반환 {telemetry.returns}</span>
            </div>
          </header>

          <div className="visualizer-viewport">
            <StageVisualization execution={activeExecution} speed={speed} stageKey={activeStageKey} />
          </div>

          <div className="execution-hud">
            <div className="playback-controls">
              <button
                className={`play-btn ${isRunning ? 'running' : ''}`}
                disabled={isRunning}
                onClick={() => executeStage({ autoPlay: true })}
                type="button"
                title="전체 실행 (Enter)"
              >
                {isRunning ? '추적 중...' : '▶ 실행'}
              </button>
              <button 
                className="step-btn" 
                disabled={isRunning} 
                onClick={handleStep} 
                type="button"
                title="한 단계 (Space)"
              >
                한 단계
              </button>
              <button 
                className="step-btn" 
                onClick={handleStop} 
                style={{ background: 'rgba(255, 102, 128, 0.1)', borderColor: '#ff6680', color: '#ff6680' }}
                type="button"
                title="정지 및 초기화"
              >
                ■ 정지
              </button>
            </div>
            
            <div className="speed-slider">
              <span>속도</span>
              <input
                max="2"
                min="0.6"
                onChange={(event) => setSpeed(Number(event.target.value))}
                step="0.1"
                type="range"
                value={speed}
              />
              <strong>{speed.toFixed(1)}x</strong>
            </div>

            <div className="run-status">
              <span className="status-text">{statusMessage || activeStage.readyMessage}</span>
              <span className="result-badge">결과: <strong>{activeExecution.result ?? '대기 중'}</strong></span>
            </div>
          </div>
        </section>

        {/* Right Pane: Code Editor */}
        <section className="code-pane window-panel">
          <header className="pane-header">
            <h2>{activeStage.title}</h2>
            <div className="mode-toggle" role="tablist">
              <button
                className={editorMode === 'blocks' ? 'selected' : ''}
                onClick={() => setEditorMode('blocks')}
                type="button"
                title="단축키: 1"
              >
                블록 코딩
              </button>
              <button
                className={editorMode === 'python' ? 'selected' : ''}
                onClick={() => setEditorMode('python')}
                type="button"
                title="단축키: 2"
              >
                파이썬
              </button>
            </div>
          </header>

          <div className="stage-info">
            <div className="stage-info-row">
              <span className="stage-info-badge">{activeStage.difficulty}</span>
              <p><strong>문제:</strong> {activeStage.objective}</p>
            </div>
            <p style={{ margin: '4px 0' }}><strong>개념:</strong> {activeStage.concept}</p>
            {activeStage.providedFunctions && (
              <p style={{ margin: '4px 0', color: 'var(--color-accent)' }}>
                <strong>제공 함수:</strong> {activeStage.providedFunctions}
              </p>
            )}
            <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              실행 시 자동으로 <code style={{ background: '#e9eef2', padding: '1px 5px', borderRadius: 3 }}>{activeStage.entryExpression}</code> 을(를) 호출합니다.
            </p>

            {/* Hint Panel */}
            {activeStage.hints && activeStage.hints.length > 0 && (
              <div className="hint-panel">
                {activeStage.hints.slice(0, hintCounts[activeStageKey] || 0).map((hint, i) => (
                  <div key={i} className="hint-item">
                    <strong>힌트 {i + 1}</strong> {hint}
                  </div>
                ))}
                {(hintCounts[activeStageKey] || 0) < activeStage.hints.length ? (
                  <button
                    className="hint-btn"
                    type="button"
                    onClick={() => setHintCounts(c => ({ ...c, [activeStageKey]: (c[activeStageKey] || 0) + 1 }))}
                  >
                    💡 힌트 {(hintCounts[activeStageKey] || 0) + 1} 보기 ({activeStage.hints.length - (hintCounts[activeStageKey] || 0)}개 남음)
                  </button>
                ) : (
                  <p className="hint-exhausted">모든 힌트를 확인했습니다. 이제 직접 해보세요!</p>
                )}
              </div>
            )}
          </div>

          <div className="editor-viewport">
            {editorMode === 'blocks' ? (
              <BlocklyEditor
                key={`${activeStageKey}-blocks`}
                onWorkspaceChange={handleWorkspaceChange}
                stage={activeStage}
                workspaceData={workspaceStates[activeStageKey]}
              />
            ) : (
              <PythonEditor
                ariaLabel={`${activeStage.title} 파이썬 편집기`}
                onChange={handlePythonChange}
                value={activeCode}
              />
            )}
          </div>
          
          {(pythonWarning || (isRunStale && activeExecution.trace.length > 0)) && (
            <div className="editor-notifications">
              {pythonWarning && <div className="toast warning">{pythonWarning}</div>}
              {(isRunStale && activeExecution.trace.length > 0) && (
                <div className="toast alert">코드가 변경되었습니다. 다시 실행하세요.</div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
