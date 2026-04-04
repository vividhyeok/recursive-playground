function buildChain(types) {
  let block = null

  for (let index = types.length - 1; index >= 0; index -= 1) {
    block = {
      type: types[index],
      ...(block ? { next: { block } } : {}),
    }
  }

  return block
}

function buildWorkspace(functionType, bodyTypes = []) {
  const functionBlock = {
    type: functionType,
    x: 24,
    y: 24,
  }

  const body = buildChain(bodyTypes)
  if (body) {
    functionBlock.inputs = {
      BODY: {
        block: body,
      },
    }
  }

  return {
    blocks: {
      languageVersion: 0,
      blocks: [functionBlock],
    },
  }
}

function extractFunctionBody(code, functionName) {
  const lines = code.replace(/\r/g, '').split('\n')
  const headerRegex = new RegExp(`^def\\s+${functionName}\\s*\\(`)
  const headerIndex = lines.findIndex((line) => headerRegex.test(line.trim()))

  if (headerIndex === -1) {
    return null
  }

  const bodyLines = []

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const raw = lines[index]
    const trimmed = raw.trim()

    if (!trimmed) {
      continue
    }

    const indent = raw.match(/^\s*/)?.[0].length ?? 0
    if (indent < 4) {
      break
    }

    bodyLines.push({
      indent: Math.max(1, Math.floor(indent / 4)),
      text: trimmed,
    })
  }

  return bodyLines
}

function parseFactorial(code) {
  const body = extractFunctionBody(code, 'factorial')
  if (!body) {
    return null
  }

  const types = []

  for (let index = 0; index < body.length; index += 1) {
    const line = body[index]
    const nextLine = body[index + 1]

    if (
      line.indent === 1 &&
      /^if\s+n\s*==\s*1\s*:$/.test(line.text) &&
      nextLine?.indent === 2 &&
      /^return\s+1$/.test(nextLine.text)
    ) {
      types.push('rp_factorial_base_case')
      index += 1
      continue
    }

    if (
      line.indent === 1 &&
      /^return\s+n\s*\*\s*factorial\s*\(\s*n\s*-\s*1\s*\)$/.test(line.text)
    ) {
      types.push('rp_factorial_recursive_return')
    }
  }

  return buildWorkspace('rp_factorial_function', types)
}

function parseFibonacci(code) {
  const body = extractFunctionBody(code, 'fib')
  if (!body) {
    return null
  }

  const types = []

  for (let index = 0; index < body.length; index += 1) {
    const line = body[index]
    const nextLine = body[index + 1]

    if (
      line.indent === 1 &&
      /^if\s+n\s*<=\s*1\s*:$/.test(line.text) &&
      nextLine?.indent === 2 &&
      /^return\s+n$/.test(nextLine.text)
    ) {
      types.push('rp_fibonacci_base_case')
      index += 1
      continue
    }

    if (
      line.indent === 1 &&
      /^return\s+fib\s*\(\s*n\s*-\s*1\s*\)\s*\+\s*fib\s*\(\s*n\s*-\s*2\s*\)$/.test(
        line.text,
      )
    ) {
      types.push('rp_fibonacci_recursive_return')
    }
  }

  return buildWorkspace('rp_fibonacci_function', types)
}

function parseHanoi(code) {
  const body = extractFunctionBody(code, 'hanoi')
  if (!body) {
    return null
  }

  const types = []

  for (let index = 0; index < body.length; index += 1) {
    const line = body[index]
    const nextLine = body[index + 1]
    const thirdLine = body[index + 2]

    if (
      line.indent === 1 &&
      /^if\s+n\s*==\s*1\s*:$/.test(line.text) &&
      nextLine?.indent === 2 &&
      /^move_disk\s*\(\s*from_peg\s*,\s*to_peg\s*\)$/.test(nextLine.text) &&
      thirdLine?.indent === 2 &&
      /^return$/.test(thirdLine.text)
    ) {
      types.push('rp_hanoi_base_case')
      index += 2
      continue
    }

    if (
      line.indent === 1 &&
      /^hanoi\s*\(\s*n\s*-\s*1\s*,\s*from_peg\s*,\s*aux_peg\s*,\s*to_peg\s*\)$/.test(
        line.text,
      )
    ) {
      types.push('rp_hanoi_recursive_left')
      continue
    }

    if (
      line.indent === 1 &&
      /^move_disk\s*\(\s*from_peg\s*,\s*to_peg\s*\)$/.test(line.text)
    ) {
      types.push('rp_hanoi_move_disk')
      continue
    }

    if (
      line.indent === 1 &&
      /^hanoi\s*\(\s*n\s*-\s*1\s*,\s*aux_peg\s*,\s*to_peg\s*,\s*from_peg\s*\)$/.test(
        line.text,
      )
    ) {
      types.push('rp_hanoi_recursive_right')
    }
  }

  return buildWorkspace('rp_hanoi_function', types)
}

export const STAGE_ORDER = ['stage1', 'stage2', 'stage3']

export const STAGES = {
  stage1: {
    key: 'stage1',
    number: 1,
    shortLabel: 'Factorial',
    title: 'Stage 1: Factorial',
    subtitle: 'Watch one recursive branch dive down and climb back with a value.',
    concept:
      'Each frame shrinks the argument by one until the base case resolves the entire stack.',
    objective: 'Complete factorial so factorial(5) returns 120.',
    modeHint: 'Drag the base case and recursive return into the scaffold, or edit the Python directly.',
    functionName: 'factorial',
    functionBlockType: 'rp_factorial_function',
    entryExpression: 'factorial(5)',
    trackedFunctions: ['factorial'],
    starterCode: ['def factorial(n):', '    pass'].join('\n'),
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_factorial_base_case' },
        { kind: 'block', type: 'rp_factorial_recursive_return' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_factorial_function'),
    parseToWorkspace: parseFactorial,
    validate: ({ result }) => Number(result) === 120,
    successMessage: 'factorial(5) returned 120. Stage 2 is unlocked.',
  },
  stage2: {
    key: 'stage2',
    number: 2,
    shortLabel: 'Fibonacci',
    title: 'Stage 2: Fibonacci',
    subtitle: 'One call becomes two, and the stack turns into a branching tree.',
    concept:
      'Binary recursion expands outward, revealing repeated work when the same subproblems appear more than once.',
    objective: 'Complete fib so fib(6) returns 8.',
    modeHint: 'You need both the base case and the split return that calls fib twice.',
    functionName: 'fib',
    functionBlockType: 'rp_fibonacci_function',
    entryExpression: 'fib(6)',
    trackedFunctions: ['fib'],
    starterCode: ['def fib(n):', '    pass'].join('\n'),
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_fibonacci_base_case' },
        { kind: 'block', type: 'rp_fibonacci_recursive_return' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_fibonacci_function'),
    parseToWorkspace: parseFibonacci,
    validate: ({ result }) => Number(result) === 8,
    successMessage: 'fib(6) returned 8. Stage 3 is unlocked.',
  },
  stage3: {
    key: 'stage3',
    number: 3,
    shortLabel: 'Tower of Hanoi',
    title: 'Stage 3: Tower of Hanoi',
    subtitle: 'The algorithm emerges by moving a smaller tower out of the way.',
    concept:
      'The recursive shape is decomposition: move n - 1 aside, move the largest disk, then rebuild the smaller tower.',
    objective: 'Complete hanoi so all 3 disks end on peg C.',
    modeHint:
      'Place the base case, the first recursive call, the move_disk action, and the second recursive call in order.',
    functionName: 'hanoi',
    functionBlockType: 'rp_hanoi_function',
    entryExpression: "hanoi(3, 'A', 'C', 'B')",
    trackedFunctions: ['hanoi'],
    starterCode: ['def hanoi(n, from_peg, to_peg, aux_peg):', '    pass'].join('\n'),
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_hanoi_base_case' },
        { kind: 'block', type: 'rp_hanoi_recursive_left' },
        { kind: 'block', type: 'rp_hanoi_move_disk' },
        { kind: 'block', type: 'rp_hanoi_recursive_right' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_hanoi_function'),
    parseToWorkspace: parseHanoi,
    validate: ({ pegs }) => pegs.C.join(',') === '3,2,1',
    successMessage: 'All disks reached peg C. Recursive Playground is complete.',
  },
}

export function isStageUnlocked(stageKey, completion) {
  if (stageKey === 'stage1') {
    return true
  }

  if (stageKey === 'stage2') {
    return completion.stage1
  }

  return completion.stage2
}

export function getInitialStage(completion) {
  if (!completion.stage1) {
    return 'stage1'
  }
  if (!completion.stage2) {
    return 'stage2'
  }
  return 'stage3'
}
