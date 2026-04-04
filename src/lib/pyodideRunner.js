const PYODIDE_VERSION = '0.29.3'
const PYODIDE_SRC = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`

let pyodidePromise = null

function loadPyodideScript() {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve()
      return
    }

    const existing = document.querySelector(`script[src="${PYODIDE_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = PYODIDE_SRC
    script.async = true
    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', reject, { once: true })
    document.head.appendChild(script)
  })
}

export async function getPyodideInstance() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadPyodideScript()
      return window.loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
      })
    })()
  }

  return pyodidePromise
}

export async function runStudentCode(stage, code) {
  const pyodide = await getPyodideInstance()
  const pythonScript = `
import json
import sys

student_code = ${JSON.stringify(code)}
entry_expression = ${JSON.stringify(stage.entryExpression)}
tracked_functions = set(${JSON.stringify(stage.trackedFunctions)})
trace_events = []
call_depth = 0
max_depth = 80

def snapshot(value):
    if isinstance(value, (int, float, str, bool)) or value is None:
        return value
    return repr(value)

def move_disk(source, target):
    trace_events.append({
        "type": "move",
        "from": source,
        "to": target,
    })

def tracer(frame, event, arg):
    global call_depth
    name = frame.f_code.co_name
    if name not in tracked_functions:
        return tracer

    if event == "call":
        call_depth += 1
        if call_depth > max_depth:
            raise RecursionError("depth limit reached")
        trace_events.append({
            "type": "call",
            "func": name,
            "args": {key: snapshot(value) for key, value in frame.f_locals.items()},
            "depth": call_depth,
        })
    elif event == "return":
        trace_events.append({
            "type": "return",
            "func": name,
            "value": snapshot(arg),
            "depth": call_depth,
        })
        call_depth -= 1
    return tracer

namespace = {
    "move_disk": move_disk,
}
result = None
error = None

try:
    exec(student_code, namespace, namespace)
    sys.settrace(tracer)
    result = eval(entry_expression, namespace, namespace)
except RecursionError:
    error = "기저 조건이 없어 보입니다. 재귀가 너무 깊어져 스택이 넘쳤습니다."
except Exception as exc:
    error = f"{type(exc).__name__}: {exc}"
finally:
    sys.settrace(None)

json.dumps({
    "trace": trace_events,
    "result": snapshot(result),
    "error": error,
})
`

  const payload = await pyodide.runPythonAsync(pythonScript)
  return JSON.parse(payload)
}
