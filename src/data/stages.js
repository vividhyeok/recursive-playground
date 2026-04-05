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

// Dummy parsers: For production, we would use regex. Right now we just return default to avoid crashing.
const parseDummy = (funcType) => (code) => buildWorkspace(funcType)

export const STAGE_ORDER = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6']

export const STAGES = {
  stage1: {
    key: 'stage1',
    number: 1,
    shortLabel: '카운트다운',
    title: '1단계: 카운트다운 (단일 콜스택)',
    subtitle: 'N부터 0까지 호출하며 스택이 쌓였다가 되돌아옵니다.',
    concept: '가장 기본적인 단일 호출 재귀입니다.',
    objective: 'countdown(5)가 0까지 도달한 뒤 종료되야 합니다.',
    modeHint: '블록을 배치하여 n이 0이면 리턴하고, 아니면 n-1로 다시 호출하세요.',
    worldName: '초보자의 우물',
    missionName: '스택 쌓기',
    arenaName: '카운트다운 궤적',
    difficulty: '입문',
    readyMessage: '실행하면 박스가 차곡차곡 쌓입니다.',
    functionName: 'countdown',
    functionBlockType: 'rp_countdown_function',
    entryExpression: 'countdown(5)',
    trackedFunctions: ['countdown'],
    starterCode: 'def countdown(n):\n    pass',
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
    validate: ({ trace }) => trace.some(t => t.type === 'call' && t.args.n === 0),
    successMessage: '0까지 카운트다운 완료!',
  },
  stage2: {
    key: 'stage2',
    number: 2,
    shortLabel: '팩토리얼',
    title: '2단계: 팩토리얼 (값 리턴)',
    subtitle: '계산된 결과를 다시 들고 올라오는 구조입니다.',
    concept: '재귀 호출의 반환값을 연산에 사용하여 최종값을 도출합니다.',
    objective: 'factorial(5)가 120을 반환하도록 만드세요.',
    modeHint: '기저 조건(1 반환)과 재귀 호출(n * factorial(n-1))을 조립하세요.',
    worldName: '수식 공장',
    missionName: '연쇄 곱셈',
    arenaName: '팩토리얼 파이프',
    difficulty: '기초',
    readyMessage: '오류가 나도 궤적을 끝까지 재생하여 보여줍니다.',
    functionName: 'factorial',
    functionBlockType: 'rp_factorial_function',
    entryExpression: 'factorial(5)',
    trackedFunctions: ['factorial'],
    starterCode: 'def factorial(n):\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_factorial_if_equals' },
        { kind: 'block', type: 'rp_factorial_return_const' },
        { kind: 'block', type: 'rp_factorial_return_recursive' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_factorial_function'),
    parseToWorkspace: parseDummy('rp_factorial_function'),
    validate: ({ result }) => Number(result) === 120,
    successMessage: '팩토리얼 계산 정답!',
  },
  stage3: {
    key: 'stage3',
    number: 3,
    shortLabel: '쿼드트리',
    title: '3단계: 색종이(쿼드트리)',
    subtitle: '공간을 4개의 사각형으로 내면으로 쪼개어 갑니다 (분할 정복).',
    concept: '바깥으로 끝없이 뻗어가는 대신 제한된 화폭 안으로 무한히 파고듭니다.',
    objective: 'size가 1 이하일 때 멈추도록 하여 화면을 쪼개보세요.',
    modeHint: '재귀를 한꺼번에 여러 방향으로 호출합니다.',
    worldName: '프랙탈 캔버스',
    missionName: '공간 분할',
    arenaName: '조각 보드',
    difficulty: '중급',
    readyMessage: '실행하면 십자 형태로 사각형이 끊임없이 등분됩니다.',
    functionName: 'quadtree',
    functionBlockType: 'rp_quadtree_function',
    entryExpression: 'quadtree(0, 0, 16)',
    trackedFunctions: ['quadtree'],
    starterCode: 'def quadtree(x, y, size):\n    pass',
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
    validate: ({ trace }) => trace.length > 20,
    successMessage: '화면 분할에 성공했습니다.',
  },
  stage4: {
    key: 'stage4',
    number: 4,
    shortLabel: '배열/문자 뒤집기',
    title: '4단계: 양끝 스왑 (데이터 조작)',
    subtitle: '두 개의 포인터가 중앙을 향해 다가오며 궤적을 좁힙니다.',
    concept: '인덱스를 조작하여 데이터를 직접 스왑합니다.',
    objective: 'left가 right와 엇갈릴 때까지 재귀하며 문자를 스왑하세요.',
    modeHint: '엇갈리면 멈추고, 아니면 스왑 후 +1, -1로 재귀합니다.',
    worldName: '로봇 팔 창고',
    missionName: '순서 대역전',
    arenaName: '레일 스왑',
    difficulty: '중급',
    readyMessage: '실행 시 포인터가 양 끝에서 다가오며 원소를 바꿉니다.',
    functionName: 'reverse',
    functionBlockType: 'rp_reverse_function',
    entryExpression: 'reverse(0, 4)',
    trackedFunctions: ['reverse'],
    starterCode: 'def reverse(left, right):\n    pass',
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
    validate: ({ trace }) => trace.some(t => t.type === 'call' && t.args.left >= t.args.right),
    successMessage: '성공적으로 모두 뒤집었습니다!',
  },
  stage5: {
    key: 'stage5',
    number: 5,
    shortLabel: '미로 탈출 (DFS)',
    title: '5단계: 미로 백트래킹',
    subtitle: '길이 막히면 되돌아옵니다.',
    concept: '가장 핵심적인 재귀 기법인 [백트래킹]을 시각화합니다.',
    objective: '목적지를 찾을 때까지 사방을 탐색하세요.',
    modeHint: '갈 수 있는 곳을 파고들다가 길이 막히면 함수가 종료(Return)되어 이전 위치로 회귀합니다.',
    worldName: '어둠의 미로',
    missionName: '생쥐의 모험',
    arenaName: '격자 감옥',
    difficulty: '도전',
    readyMessage: '실행하면 생쥐가 갈림길에서 깊이 우선으로 직진합니다.',
    functionName: 'dfs',
    functionBlockType: 'rp_maze_function',
    entryExpression: 'dfs(0, 0)',
    trackedFunctions: ['dfs'],
    starterCode: 'def dfs(x, y):\n    pass',
    toolbox: {
      kind: 'flyoutToolbox',
      contents: [
        { kind: 'block', type: 'rp_maze_if_exit' },
        { kind: 'block', type: 'rp_maze_explore' },
      ],
    },
    defaultWorkspace: () => buildWorkspace('rp_maze_function'),
    parseToWorkspace: parseDummy('rp_maze_function'),
    validate: ({ result }) => result === true,
    successMessage: '미로를 완전히 탈출했습니다.',
  },
  stage6: {
    key: 'stage6',
    number: 6,
    shortLabel: '하노이 탑',
    title: '최종보스: 하노이 탑',
    subtitle: 'N-1개를 비켜두고 가장 큰 원반을 옮깁니다.',
    concept: '복합 분할 논리 재귀. 모든 교육과정의 끝입니다.',
    objective: 'hanoi(4)이 모든 원반을 성공적으로 C로 옮겨야 합니다.',
    modeHint: '기저 조건 -> 왼쪽 재귀 -> 무브 -> 오른쪽 재귀.',
    worldName: '하노이 신전',
    missionName: '최종 의식',
    arenaName: '수도승의 기둥',
    difficulty: '심화',
    readyMessage: '재귀 트리가 원반의 물리적 움직임으로 변환됩니다.',
    functionName: 'hanoi',
    functionBlockType: 'rp_hanoi_function',
    entryExpression: "hanoi(4, 'A', 'C', 'B')",
    trackedFunctions: ['hanoi'],
    starterCode: 'def hanoi(n, from_peg, to_peg, aux_peg):\n    pass',
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
    validate: ({ pegs }) => pegs?.C?.join(',') === '4,3,2,1',
    successMessage: '축하합니다! 하노이 탑을 완벽히 정복했습니다.',
  },
}

export function isStageUnlocked(stageKey, completions) {
  return true;
}
export function getInitialStage() { return 'stage1' }
