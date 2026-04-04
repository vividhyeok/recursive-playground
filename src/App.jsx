import { useEffect, useMemo, useState } from 'react'
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

  const activeStage = STAGES[activeStageKey]
  const activeExecution = executions[activeStageKey]
  const activeCode = codes[activeStageKey]
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
    setStatusMessage('')
    setPythonWarning('')
  }, [activeStageKey])

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
    setStatusMessage('Loading Pyodide and tracing the recursive execution...')

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
        setStatusMessage('The trace ran, but the disks did not finish on peg C yet.')
      } else {
        setStatusMessage('The trace ran, but the final answer is not correct yet.')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Pyodide failed to load or run the code.'
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
      'Python updated, but Blockly could not rebuild this version of the function. The text still runs.',
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

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Interactive recursion studio</p>
          <h1>Recursive Playground</h1>
          <p className="lede">
            Write the recursive rule, then watch the structure unfold in the world itself.
          </p>
        </div>
        <div className="progress-card">
          <span>{progressCount} / 3 complete</span>
          <strong>{completion.stage3 ? 'All stages cleared' : 'Progress is saved locally'}</strong>
        </div>
      </header>

      <nav className="stage-tabs" aria-label="Stage selection">
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
              <span>{stage.title}</span>
              <small>
                {completion[stageKey] ? 'Completed' : unlocked ? 'Unlocked' : 'Locked'}
              </small>
            </button>
          )
        })}
      </nav>

      <section className="stage-brief">
        <div className="brief-card">
          <span className="brief-tag">Concept</span>
          <p>{activeStage.concept}</p>
        </div>
        <div className="brief-card">
          <span className="brief-tag">Objective</span>
          <p>{activeStage.objective}</p>
        </div>
        <div className="brief-card">
          <span className="brief-tag">Editor Hint</span>
          <p>{activeStage.modeHint}</p>
        </div>
      </section>

      <main className="workspace">
        <section className="panel code-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Code Panel</p>
              <h2>{activeStage.title}</h2>
              <p>{activeStage.subtitle}</p>
            </div>
            <div className="mode-toggle" role="tablist" aria-label="Code mode">
              <button
                className={editorMode === 'blocks' ? 'selected' : ''}
                onClick={() => setEditorMode('blocks')}
                type="button"
              >
                Blocks
              </button>
              <button
                className={editorMode === 'python' ? 'selected' : ''}
                onClick={() => setEditorMode('python')}
                type="button"
              >
                Python
              </button>
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
                aria-label={`${activeStage.title} Python editor`}
                className="python-editor"
                onChange={(event) => handlePythonChange(event.target.value)}
                spellCheck={false}
                value={activeCode}
              />
            )}
          </div>

          <div className="controls">
            <button
              className="primary"
              disabled={isRunning}
              onClick={() => executeStage({ autoPlay: true })}
              type="button"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button className="secondary" disabled={isRunning} onClick={handleStep} type="button">
              Step
            </button>
            <label className="speed-control">
              <span>Speed</span>
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
            <strong>Status</strong>
            <p>{statusMessage || 'Ready to trace the next recursive run.'}</p>
            {pythonWarning ? <p className="warning">{pythonWarning}</p> : null}
            {isRunStale && activeExecution.trace.length ? (
              <p className="warning">Code changed after the last trace. Run again to refresh the animation.</p>
            ) : null}
          </div>
        </section>

        <section className="panel visual-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Visualization Panel</p>
              <h2>{activeStage.shortLabel}</h2>
              <p>Trace events replay here in time order.</p>
            </div>
            <div className="playback-badge">
              <span>{activeExecution.playhead}</span>
              <small>of {activeExecution.trace.length} events</small>
            </div>
          </div>

          <div className="visual-frame">
            <StageVisualization execution={activeExecution} speed={speed} stageKey={activeStageKey} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
