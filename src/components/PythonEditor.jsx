import React, { useRef, useEffect } from 'react'

export default function PythonEditor({ value, onChange, ariaLabel, disabled }) {
  const textareaRef = useRef(null)

  const insertTextAtCursor = (text, cursorOffset = text.length, deleteCount = 0) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.slice(0, start) + text + value.slice(end + deleteCount)
    
    onChange(newValue)

    // Move cursor after React render cycle
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cursorOffset
    }, 0)
  }

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.slice(start, end)

    // 1. Handle Tab (Insert 4 spaces)
    if (e.key === 'Tab') {
      e.preventDefault()
      // Note: A robust IDE handles multi-line indent. We keep it simple here.
      insertTextAtCursor('    ')
      return
    }

    // 2. Handle Auto-pairs
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      "'": "'",
      '"': '"'
    }

    if (pairs[e.key]) {
      // If we select text and surround it
      if (selectedText) {
        e.preventDefault()
        insertTextAtCursor(`${e.key}${selectedText}${pairs[e.key]}`, selectedText.length + 2, 0)
      } else {
        // Just auto bracket
        // Don't auto-close quotes if the next char is an alphanumeric (keeps from breaking existing strings)
        if ((e.key === "'" || e.key === '"') && value[end] && /[a-zA-Z0-9]/.test(value[end])) {
          return // Let default behaviour happen
        }
        e.preventDefault()
        insertTextAtCursor(`${e.key}${pairs[e.key]}`, 1)
      }
      return
    }

    // 3. Handle Enter (Auto-indentation)
    if (e.key === 'Enter') {
      const lines = value.slice(0, start).split('\n')
      const currentLine = lines[lines.length - 1]
      const match = currentLine.match(/^(\s*)/)
      let spaces = match ? match[1] : ''

      // If line ends with colon, increase indent by 4 spaces
      if (currentLine.trimEnd().endsWith(':')) {
        spaces += '    '
      }

      if (spaces) {
        e.preventDefault()
        insertTextAtCursor(`\n${spaces}`)
        return
      }
    }

    // 4. Handle Backspace on empty pairs
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = value[start - 1]
      const nextChar = value[start]
      if (
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === "'" && nextChar === "'") ||
        (prevChar === '"' && nextChar === '"')
      ) {
        e.preventDefault()
        // Delete both the opening and closing character
        const newValue = value.slice(0, start - 1) + value.slice(start + 1)
        onChange(newValue)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1
        }, 0)
        return
      }
    }
  }

  return (
    <textarea
      ref={textareaRef}
      aria-label={ariaLabel}
      className="python-editor"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      value={value}
      disabled={disabled}
    />
  )
}
