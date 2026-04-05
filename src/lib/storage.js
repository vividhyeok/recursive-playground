function getStorageKey(stageKey, type) {
  return `rp_${stageKey}_${type}`
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
      const codeKey = getStorageKey(stageKey, 'code')
      const completeKey = getStorageKey(stageKey, 'complete')

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

  storage.setItem(getStorageKey(stageKey, 'code'), code)
}

export function persistStageCompletion(stageKey, complete) {
  const storage = safeLocalStorage()
  if (!storage) {
    return
  }

  storage.setItem(getStorageKey(stageKey, 'complete'), String(Boolean(complete)))
}

export function clearAllProgress() {
  const storage = safeLocalStorage()
  if (!storage) return

  const keysToRemove = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && key.startsWith('rp_')) keysToRemove.push(key)
  }
  keysToRemove.forEach(k => storage.removeItem(k))
}
