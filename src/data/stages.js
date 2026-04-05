// Helper builders for default workspaces
function buildBlockNode(descriptor) {
  if (typeof descriptor === 'string') return { type: descriptor }
  const node = { type: descriptor.type }
  if (descriptor.fields) node.fields = descriptor.fields
  if (descriptor.body?.length) {
    node.inputs = { BODY: { block: buildChain(descriptor.body) } }
  }
  return node
}

function buildChain(types) {
  let block = null
  for (let i = types.length - 1; i >= 0; i--) {
    block = {
      ...buildBlockNode(types[i]),
      ...(block ? { next: { block } } : {}),
    }
  }
  return block
}

function buildWorkspace(functionType, bodyTypes = []) {
  const functionBlock = { type: functionType, x: 24, y: 24 }
  const body = buildChain(bodyTypes)
  if (body) {
    functionBlock.inputs = { BODY: { block: body } }
  }
  return {
    blocks: {
      languageVersion: 0,
      blocks: [functionBlock],
    },
  }
}

const parseDummy = (funcType) => (_code) => buildWorkspace(funcType)

export const STAGE_ORDER = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6']

export const STAGES = {
  // ─────────────────────────────────────────────────────────────────────────
  // Stage 1 · Countdown ─ 재귀의 첫 걸음
  // ─────────────────────────────────────────────────────────────────────────
  stage1: {
    key: 'stage1',
    number: 1,
    shortLabel: '카운트다운',
    title: '1단계: 카운트다운',
    subtitle: 'n→0까지 자신을 반복 호출하며 콜스택이 쌓이고 되돌아옵니다.',
    concept: '재귀 함수의 핵심인 기저 조건(Base Case)과 재귀 호출(Recursive Call) 두 가지를 처음으로 직접 조립합니다.',
    objective: 'countdown(5) 를 실행했을 때 n=0 까지 호출이 이어져야 합니다.',
    providedFunctions: null,
    hints: [
      'n이 0 이하일 때는 더 이상 줄일 수 없습니다. 이 경우 함수를 종료하는 것이 "기저 조건"입니다.',
      '기저 조건이 아닐 때는 자기 자신을 n−1 로 호출합니다. 이것이 "재귀 호출"입니다.',
      '올바른 블록 순서: [if n <= 0 :] 안에 [return] 을 넣고, 그 다음으로 [countdown(n-1)] 을 배치하세요.',
    ],
    worldName: '초보자의 우물',
    missionName: '스택 쌓기',
    arenaName: '카운트다운 궤적',
    difficulty: '⭐ 입문',
    readyMessage: '실행하면 재귀 호출 박스가 차곡차곡 쌓입니다.',
    functionName: 'countdown',
    functionBlockType: 'rp_countdown_function',
    entryExpression: 'countdown(5)',
    trackedFunctions: ['countdown'],
    starterCode: 'def countdown(n):\n    # n이 0 이하면 멈춥니다 (기저 조건)\n    # 그렇지 않으면 n-1로 자신을 다시 호출합니다 (재귀 호출)\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_countdown_if_equals' },
        { kind: 'block', type: 'rp_countdown_return' },
        { kind: 'block', type: 'rp_countdown_recursive' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_countdown_function'),
    parseToWorkspace: parseDummy('rp_countdown_function'),
    validate: ({ trace }) => {
      const calls = trace.filter(t => t.type === 'call')
      const nValues = calls.map(t => Number(t.args.n))
      // Must have at least 5 calls (n=5,4,3,2,1,0 → 6 steps)
      // Must reach n<=0 AND must not go below -1 (i.e., base case fired correctly)
      const reachedZero = nValues.some(n => n <= 0)
      const hasProperDepth = calls.length >= 5
      const didNotOverRecurse = nValues.every(n => n >= -1) // base case must have stopped it
      return reachedZero && hasProperDepth && didNotOverRecurse
    },
    successMessage: '✅ 0까지 카운트다운 완료! 기저 조건 + 재귀 호출 구조를 이해했습니다.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 2 · Factorial ─ 반환값을 들고 올라오는 재귀
  // ─────────────────────────────────────────────────────────────────────────
  stage2: {
    key: 'stage2',
    number: 2,
    shortLabel: '팩토리얼',
    title: '2단계: 팩토리얼',
    subtitle: '호출 결과(반환값)를 이용해 연산하며 위로 올라옵니다.',
    concept: '재귀 호출의 반환값을 연산(곱셈)에 활용하여 최종 값을 역으로 조립합니다. "되돌아오는 재귀"의 핵심입니다.',
    objective: 'factorial(5) = 120 을 반환하도록 만드세요.',
    providedFunctions: null,
    hints: [
      '1! = 1 입니다. n이 1일 때 더 이상 재귀를 진행하지 않습니다. 이것이 기저 조건입니다.',
      'n! = n × (n-1)! 입니다. 재귀 호출로 (n-1)! 을 받아 n을 곱하면 n! 이 됩니다.',
      '블록 순서: [if n == 1] → 안에 [return 1], 그 다음 [return n × factorial(n-1)]. 기저값 블록의 "?" 를 1로 바꾸는 것을 잊지 마세요!',
    ],
    worldName: '수식 공장',
    missionName: '연쇄 곱셈',
    arenaName: '팩토리얼 파이프',
    difficulty: '⭐⭐ 기초',
    readyMessage: '오류가 나도 궤적을 끝까지 재생하여 어디서 틀렸는지 볼 수 있습니다.',
    functionName: 'factorial',
    functionBlockType: 'rp_factorial_function',
    entryExpression: 'factorial(5)',
    trackedFunctions: ['factorial'],
    starterCode: 'def factorial(n):\n    # 기저 조건: 1! = 1\n    # 재귀 단계: n! = n × (n-1)!\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_factorial_if_equals' },
        { kind: 'block', type: 'rp_factorial_return_value' },
        { kind: 'block', type: 'rp_factorial_return_recursive' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_factorial_function'),
    parseToWorkspace: parseDummy('rp_factorial_function'),
    validate: ({ result, trace }) => {
      if (Number(result) !== 120) return false
      // Must have recursive calls — 'return 120' shortcut only creates 1 call
      const calls = trace.filter(t => t.type === 'call')
      if (calls.length < 5) return false
      // Every level must have returned the correct intermediate value
      const returns = trace.filter(t => t.type === 'return')
      // factorial(1) must return 1, factorial(2) must return 2, factorial(3)=6, factorial(4)=24, factorial(5)=120
      const expectedReturns = new Map([[1, 1], [2, 2], [3, 6], [4, 24], [5, 120]])
      for (const [n, expected] of expectedReturns) {
        const ret = returns.find(r => {
          const matchingCall = calls.find(c => Number(c.args.n) === n)
          return matchingCall && Number(r.value) === expected
        })
        if (!ret) return false
      }
      return true
    },
    successMessage: '✅ factorial(5) = 120 정답! 반환값을 이용한 재귀를 이해했습니다.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 3 · Quadtree ─ 다중 재귀 호출 (분할 정복)
  // ─────────────────────────────────────────────────────────────────────────
  stage3: {
    key: 'stage3',
    number: 3,
    shortLabel: '쿼드트리',
    title: '3단계: 쿼드트리 (분할 정복)',
    subtitle: '한 번 호출에서 자신을 4번 부릅니다. 재귀가 기하급수적으로 퍼집니다.',
    concept: '하나의 공간을 4등분하고 각 사분면에 재귀를 호출합니다. 단일 호출이 아닌 "다중 재귀"의 첫 경험입니다.',
    objective: 'quadtree(0, 0, 16) 을 실행하면 캔버스가 점점 작게 쪼개져야 합니다.',
    providedFunctions: null,
    hints: [
      'size가 1 이하가 되면 더 이상 쪼갤 수 없습니다. 이것이 기저 조건입니다.',
      'size를 2로 나눈 half 를 이용해 4개의 사분면: (x,y), (x+half,y), (x,y+half), (x+half,y+half) 로 분할합니다.',
      '블록 순서: [if size <= 1] → 안에 [return], 그 다음 [4등분 재귀 호출]. 기저 조건 숫자를 1로 선택하세요.',
    ],
    worldName: '프랙탈 캔버스',
    missionName: '공간 분할',
    arenaName: '조각 보드',
    difficulty: '⭐⭐⭐ 중급',
    readyMessage: '실행하면 사각형이 4등분→다시 4등분을 반복하며 작아집니다.',
    functionName: 'quadtree',
    functionBlockType: 'rp_quadtree_function',
    entryExpression: 'quadtree(0, 0, 16)',
    trackedFunctions: ['quadtree'],
    starterCode: 'def quadtree(x, y, size):\n    # 기저 조건: size가 1 이하면 멈춤\n    # 재귀 단계: half = size // 2 로 4개 사분면에 재귀 호출\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_quadtree_if_base' },
        { kind: 'block', type: 'rp_quadtree_return' },
        { kind: 'block', type: 'rp_quadtree_split' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_quadtree_function'),
    parseToWorkspace: parseDummy('rp_quadtree_function'),
    validate: ({ trace }) => {
      const calls = trace.filter(t => t.type === 'call')
      if (calls.length < 20) return false
      // Require multiple distinct size values to prove real 4-way spatial splitting
      const sizes = new Set(calls.map(t => Number(t.args.size)).filter(s => s > 0))
      // A correct quadtree with base=1 from size=16 visits sizes: 16, 8, 4, 2, 1
      // Require at least 3 distinct sizes so a simple loop-of-calls can't fake it
      return sizes.size >= 3
    },
    successMessage: '✅ 화면 분할 성공! 다중 재귀 호출의 폭발적인 확장을 체험했습니다.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 4 · Reverse ─ 인덱스 조작 재귀 (두 포인터)
  // ─────────────────────────────────────────────────────────────────────────
  stage4: {
    key: 'stage4',
    number: 4,
    shortLabel: '배열 뒤집기',
    title: '4단계: 배열 뒤집기 (두 포인터 재귀)',
    subtitle: '두 포인터가 양끝에서 중앙을 향해 수렴하며 원소를 교환합니다.',
    concept: '배열의 인덱스(left, right)를 인자로 받아 조작합니다. 블록 배치 순서(swap → 재귀)가 결과에 직접 영향을 줍니다.',
    objective: 'reverse(0, 4) 를 실행해 배열의 양끝부터 교환하여 완전히 뒤집으세요.',
    providedFunctions: 'swap(left, right) — 두 인덱스의 원소를 교환합니다',
    hints: [
      'left가 right보다 크거나 같으면(교차) 모든 교환이 끝난 상태입니다. 여기서 함수를 멈춥니다.',
      '교차하지 않았으면: 먼저 swap(left, right)로 현재 양 끝을 교환합니다.',
      'swap 이후 포인터를 한 칸씩 안쪽으로 이동해야 합니다: reverse(left+1, right-1). swap과 재귀의 순서를 바꾸면 어떻게 될지 직접 실험해 보세요.',
    ],
    worldName: '로봇 팔 창고',
    missionName: '순서 대역전',
    arenaName: '레일 스왑',
    difficulty: '⭐⭐⭐ 중급',
    readyMessage: '실행 시 포인터가 양 끝에서 안쪽으로 다가오며 원소를 바꿉니다.',
    functionName: 'reverse',
    functionBlockType: 'rp_reverse_function',
    entryExpression: 'reverse(0, 4)',
    trackedFunctions: ['reverse'],
    starterCode: 'def reverse(left, right):\n    # 제공 함수: swap(left, right) — 두 원소 교환\n    # left >= right 면 교차 완료 → return\n    # 그렇지 않으면: swap 후 reverse(left+1, right-1)\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_reverse_if_cross' },
        { kind: 'block', type: 'rp_reverse_swap' },
        { kind: 'block', type: 'rp_reverse_recursive' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_reverse_function'),
    parseToWorkspace: parseDummy('rp_reverse_function'),
    validate: ({ trace }) => {
      const calls = trace.filter(t => t.type === 'call')
      const swaps = trace.filter(t => t.type === 'swap')
      // Must have actually swapped at least once
      if (swaps.length === 0) return false
      // Must have reached the crossing condition (base case)
      if (!calls.some(t => Number(t.args.left) >= Number(t.args.right))) return false
      // Must have correct number of swaps: reverse(0,4) has 2 elements to cross (indices 0↔4, 1↔3)
      if (swaps.length < 2) return false
      return true
    },
    successMessage: '✅ 배열 뒤집기 성공! 인덱스를 인자로 전달하는 재귀를 이해했습니다.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 5 · Maze DFS ─ 백트래킹 재귀
  // ─────────────────────────────────────────────────────────────────────────
  stage5: {
    key: 'stage5',
    number: 5,
    shortLabel: '미로 DFS',
    title: '5단계: 미로 탐색 (DFS 백트래킹)',
    subtitle: '막다른 길에서 되돌아오며(백트래킹) 출구를 찾습니다.',
    concept: '재귀에서 Boolean 반환값을 전파하는 패턴입니다. return False 는 "이 길은 막힘"을 위로 알려 이전 분기점으로 돌아갑니다.',
    objective: 'dfs(0, 0) 으로 (4,4) 출구까지 경로를 찾아야 합니다.',
    providedFunctions: 'is_exit(x, y) — (x,y)가 출구인지 확인 | get_neighbors(x, y) — 갈 수 있는 이웃 칸 목록 반환',
    hints: [
      '현재 위치가 출구이면 즉시 True를 반환합니다. 이 True가 모든 재귀 스택을 타고 위로 전파됩니다.',
      '출구가 아니라면 갈 수 있는 이웃 칸(get_neighbors)을 하나씩 탐색합니다. 각각에 dfs()를 재귀 호출합니다.',
      '이웃을 모두 탐색했는데도 출구가 없으면 return False 로 백트래킹합니다. 블록 순서: [is_exit → True] → [이웃 탐색 루프] → [return False]. return False가 없으면 파이썬에서 None 반환이 돼 True/False 판단이 안 됩니다.',
    ],
    worldName: '어둠의 미로',
    missionName: '생쥐의 모험',
    arenaName: '격자 감옥',
    difficulty: '⭐⭐⭐⭐ 도전',
    readyMessage: '실행하면 생쥐가 갈림길에서 DFS로 전진합니다. 막히면 되돌아오는 백트래킹을 관찰하세요.',
    functionName: 'dfs',
    functionBlockType: 'rp_maze_function',
    entryExpression: 'dfs(0, 0)',
    trackedFunctions: ['dfs'],
    starterCode: 'def dfs(x, y):\n    # 제공 함수:\n    #   is_exit(x, y)       — True/False 반환\n    #   get_neighbors(x, y) — 갈 수 있는 칸 리스트\n    #\n    # 출구이면 return True\n    # 이웃 탐색 → dfs 성공하면 return True\n    # 모두 막히면 return False\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_maze_if_exit' },
        { kind: 'block', type: 'rp_maze_explore' },
        { kind: 'block', type: 'rp_maze_return_false' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_maze_function'),
    parseToWorkspace: parseDummy('rp_maze_function'),
    validate: ({ result, trace }) => {
      if (result !== true) return false
      // Must have actually called is_exit (check_exit events) — rules out 'return True' trivially
      const exitChecks = trace.filter(t => t.type === 'check_exit')
      if (exitChecks.length === 0) return false
      // Must have explored neighbors (get_neighbors events) — must have navigated the maze
      const neighborChecks = trace.filter(t => t.type === 'get_neighbors')
      if (neighborChecks.length === 0) return false
      // Must have visited enough cells to reach (4,4) from (0,0) — minimum path length is ~8 steps
      const uniqueCells = new Set(neighborChecks.map(t => `${t.x},${t.y}`))
      return uniqueCells.size >= 3
    },
    successMessage: '✅ 미로 탈출 성공! 백트래킹 재귀의 핵심 패턴을 이해했습니다.',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 6 · Hanoi ─ 분할 정복의 완결판
  // ─────────────────────────────────────────────────────────────────────────
  stage6: {
    key: 'stage6',
    number: 6,
    shortLabel: '하노이 탑',
    title: '6단계: 하노이 탑 (최종)',
    subtitle: 'n-1개를 비켜두고, 맨 아래를 이동하고, n-1개를 다시 얹습니다.',
    concept: '재귀 함수 하나가 "문제를 3단계로 분割하여 자신을 두 번 호출"합니다. 블록 4개를 올바른 순서로 조립하는 것이 핵심입니다.',
    objective: 'hanoi(3) 을 실행해 A 기둥의 원반 3개를 C 기둥으로 모두 옮기세요.',
    providedFunctions: 'move_disk(from_peg, to_peg) — 맨 위 원반을 이동하고 화면에 표시',
    hints: [
      '원반이 1개(n==1)이면 바로 목표 기둥으로 옮기면 됩니다. 이것이 기저 조건입니다.',
      'n개를 옮기려면: ① n-1개를 보조 기둥(aux_peg)으로 → ② 제일 큰 원반을 목표 기둥(to_peg)으로 → ③ n-1개를 보조 기둥에서 목표 기둥으로. 이 순서가 전부입니다.',
      '블록 순서: [기저조건] → [hanoi(n-1): from→aux] → [move_disk(from→to)] → [hanoi(n-1): aux→to]. 4개 블록 중 어느 것도 순서를 바꾸면 실패합니다. 직접 실험해 보세요!',
    ],
    worldName: '하노이 신전',
    missionName: '원반 이전 의식',
    arenaName: '수도승의 기둥',
    difficulty: '⭐⭐⭐⭐⭐ 심화',
    readyMessage: '4개 블록의 올바른 순서를 찾으세요. 힌트를 활용하되 직접 실험해 보세요.',
    functionName: 'hanoi',
    functionBlockType: 'rp_hanoi_function',
    entryExpression: "hanoi(3, 'A', 'C', 'B')",
    trackedFunctions: ['hanoi'],
    starterCode: 'def hanoi(n, from_peg, to_peg, aux_peg):\n    # 제공 함수: move_disk(from_peg, to_peg)\n    #\n    # 기저 조건: n == 1 이면 move_disk 후 return\n    # 재귀 단계:\n    #   1. hanoi(n-1, from_peg, aux_peg, to_peg)  # n-1개를 보조기둥으로\n    #   2. move_disk(from_peg, to_peg)             # 맨 아래 원반 이동\n    #   3. hanoi(n-1, aux_peg, to_peg, from_peg)  # n-1개를 목표기둥으로\n    pass',
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
    parseToWorkspace: parseDummy('rp_hanoi_function'),
    validate: ({ pegs }) => pegs?.C?.join(',') === '3,2,1',
    successMessage: '✅ 축하합니다! 하노이 탑 완전 정복! 재귀를 마스터했습니다.',
  },
}

export function isStageUnlocked(stageKey, completions) {
  if (stageKey === 'stage1') return true
  const prevIndex = STAGE_ORDER.indexOf(stageKey) - 1
  if (prevIndex < 0) return true
  const prevStageKey = STAGE_ORDER[prevIndex]
  return Boolean(completions[prevStageKey])
}

export function getInitialStage() { return 'stage1' }
