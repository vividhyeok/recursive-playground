function buildBlockNode(descriptor) {
  if (typeof descriptor === 'string') {
    return { type: descriptor }
  }

  const node = {
    type: descriptor.type,
  }

  if (descriptor.fields) {
    node.fields = descriptor.fields
  }

  if (descriptor.body?.length) {
    node.inputs = {
      BODY: {
        block: buildChain(descriptor.body),
      },
    }
  }

  return node
}

function buildChain(types) {
  let block = null

  for (let index = types.length - 1; index >= 0; index -= 1) {
    block = {
      ...buildBlockNode(types[index]),
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
      /^if\s+n\s*==\s*\d+\s*:$/.test(line.text) &&
      nextLine?.indent === 2 &&
      /^return\s+\d+$/.test(nextLine.text)
    ) {
      const baseValue = line.text.match(/\d+/)?.[0] ?? '1'
      const returnValue = nextLine.text.match(/\d+/)?.[0] ?? '1'
      types.push({
        type: 'rp_factorial_if_equals',
        fields: { BASE_N: String(baseValue) },
        body: [
          {
            type: 'rp_factorial_return_const',
            fields: { RET_N: String(returnValue) },
          },
        ],
      })
      index += 1
      continue
    }

    if (
      line.indent === 1 &&
      /^return\s+n\s*\*\s*factorial\s*\(\s*n\s*-\s*1\s*\)$/.test(line.text)
    ) {
      types.push('rp_factorial_return_recursive')
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
      /^if\s+n\s*<=\s*\d+\s*:$/.test(line.text) &&
      nextLine?.indent === 2 &&
      /^return\s+n$/.test(nextLine.text)
    ) {
      const baseValue = line.text.match(/\d+/)?.[0] ?? '1'
      types.push({
        type: 'rp_fibonacci_if_leq',
        fields: { BASE_N: String(baseValue) },
        body: ['rp_fibonacci_return_n'],
      })
      index += 1
      continue
    }

    if (
      line.indent === 1 &&
      /^left\s*=\s*fib\s*\(\s*n\s*-\s*1\s*\)$/.test(line.text)
    ) {
      types.push('rp_fibonacci_assign_left')
      continue
    }

    if (
      line.indent === 1 &&
      /^right\s*=\s*fib\s*\(\s*n\s*-\s*2\s*\)$/.test(line.text)
    ) {
      types.push('rp_fibonacci_assign_right')
      continue
    }

    if (line.indent === 1 && /^return\s+left\s*\+\s*right$/.test(line.text)) {
      types.push('rp_fibonacci_return_sum')
      continue
    }

    if (
      line.indent === 1 &&
      /^return\s+fib\s*\(\s*n\s*-\s*1\s*\)\s*\+\s*fib\s*\(\s*n\s*-\s*2\s*\)$/.test(
        line.text,
      )
    ) {
      types.push('rp_fibonacci_return_recursive')
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
    shortLabel: '팩토리얼',
    title: '1단계 팩토리얼',
    subtitle: '하나의 호출이 깊게 잠수한 뒤 결과를 들고 다시 떠오르는 구역입니다.',
    concept:
      '인자를 하나씩 줄이며 내려가고, 바닥의 기저 조건이 전체 호출 스택을 한 번에 되살립니다.',
    objective: 'factorial(5)가 120이 되도록 함수를 완성하세요.',
    modeHint: '블록을 끼워 넣거나 파이썬 코드를 직접 고쳐서 기저 조건과 재귀 반환식을 완성하세요.',
    worldName: '스택 샤프트',
    missionName: '연산 코어 점화',
    arenaName: '수직 호출 우물',
    difficulty: '튜토리얼',
    readyMessage: '규칙을 조립한 뒤 실행하면 호출 캡슐이 아래로 떨어집니다.',
    functionName: 'factorial',
    functionBlockType: 'rp_factorial_function',
    entryExpression: 'factorial(5)',
    trackedFunctions: ['factorial'],
    starterCode: ['def factorial(n):', '    pass'].join('\n'),
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_factorial_if_equals' },
        { kind: 'block', type: 'rp_factorial_return_const' },
        { kind: 'block', type: 'rp_factorial_return_recursive' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_factorial_function'),
    parseToWorkspace: parseFactorial,
    validate: ({ result }) => Number(result) === 120,
    successMessage: 'factorial(5)가 120이 되었습니다. 2단계가 해금되었습니다.',
  },
  stage2: {
    key: 'stage2',
    number: 2,
    shortLabel: '피보나치',
    title: '2단계 피보나치',
    subtitle: '한 번의 호출이 둘로 갈라지며 재귀가 나무처럼 퍼져 나가는 구역입니다.',
    concept:
      '이진 재귀는 가지를 넓게 펼치며, 같은 작은 문제를 여러 번 다시 푸는 비효율도 눈에 띄게 드러냅니다.',
    objective: 'fib(6)이 8이 되도록 함수를 완성하세요.',
    modeHint: '기저 조건 + left/right 재귀 호출을 분리해서 계산한 뒤 합산 반환해야 합니다.',
    worldName: '분기 숲',
    missionName: '쌍둥이 노드 추적',
    arenaName: '재귀 성장 지도',
    difficulty: '중급',
    readyMessage: '실행하면 노드가 퍼지며 중복 호출이 따로 강조됩니다.',
    functionName: 'fib',
    functionBlockType: 'rp_fibonacci_function',
    entryExpression: 'fib(6)',
    trackedFunctions: ['fib'],
    starterCode: ['def fib(n):', '    pass'].join('\n'),
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_fibonacci_if_leq' },
        { kind: 'block', type: 'rp_fibonacci_return_n' },
        { kind: 'block', type: 'rp_fibonacci_assign_left' },
        { kind: 'block', type: 'rp_fibonacci_assign_right' },
        { kind: 'block', type: 'rp_fibonacci_return_sum' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_fibonacci_function'),
    parseToWorkspace: parseFibonacci,
    validate: ({ result }) => Number(result) === 8,
    successMessage: 'fib(6)이 8이 되었습니다. 3단계가 해금되었습니다.',
  },
  stage3: {
    key: 'stage3',
    number: 3,
    shortLabel: '하노이 탑',
    title: '3단계 하노이 탑',
    subtitle: '작은 탑을 잠시 비켜 놓고 큰 원반을 움직이는 분해 전략을 다루는 구역입니다.',
    concept:
      '핵심은 분해입니다. n-1개를 비켜 두고, 가장 큰 원반을 옮긴 뒤, 다시 n-1개를 쌓아 올립니다.',
    objective: '모든 원반이 C 기둥으로 이동하도록 hanoi 함수를 완성하세요.',
    modeHint:
      '기저 조건, 첫 번째 재귀 호출, 원반 이동, 두 번째 재귀 호출을 올바른 순서로 배치하세요.',
    worldName: '하노이 신전',
    missionName: '원반 이전 의식',
    arenaName: '3D 의식 무대',
    difficulty: '도전',
    readyMessage: '실행하면 3D 무대에서 원반이 공중 곡선을 그리며 이동합니다.',
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
    successMessage: '모든 원반이 C 기둥에 도착했습니다. 플레이그라운드를 모두 완료했습니다.',
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
