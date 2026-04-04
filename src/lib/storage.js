const STORAGE_KEYS = {
  stage1: {
    complete: 'rp_stage1_complete',
    code: 'rp_stage1_code',
  },
  stage2: {
    complete: 'rp_stage2_complete',
    code: 'rp_stage2_code',
  },
  stage3: {
    complete: 'rp_stage3_complete',
    code: 'rp_stage3_code',
  },
}

function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readStoredProgress(stages) {
  const storage = safeLocalStorage()

  return Object.fromEntries(
    Object.keys(stages).map((stageKey) => {
      const codeKey = STORAGE_KEYS[stageKey].code
      const completeKey = STORAGE_KEYS[stageKey].complete

      return [
        stageKey,
        {
          code: storage?.getItem(codeKey) ?? stages[stageKey].starterCode,
          complete: storage?.getItem(completeKey) === 'true',
        },
      ]
    }),
  )
}

export function persistStageCode(stageKey, code) {
  const storage = safeLocalStorage()
  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEYS[stageKey].code, code)
}

export function persistStageCompletion(stageKey, complete) {
  const storage = safeLocalStorage()
  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEYS[stageKey].complete, String(Boolean(complete)))
}
