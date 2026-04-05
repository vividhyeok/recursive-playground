import * as Blockly from 'blockly'
import 'blockly/blocks'
import { pythonGenerator } from 'blockly/python'

let registered = false

function buildFunctionBlock(type, signature, color) {
  Blockly.Blocks[type] = {
    init() {
      this.appendDummyInput()
        .appendField('함수')
        .appendField(signature)
      this.appendStatementInput('BODY').setCheck('rpStatement')
      this.setColour(color)
      this.setDeletable(false)
      this.setMovable(false)
      this.setTooltip(`${signature} 함수 뼈대 — 내부에 블록을 끌어다 놓으세요`)
    },
  }
}

function buildStatementBlock(type, label, color, tooltip) {
  Blockly.Blocks[type] = {
    init() {
      this.appendDummyInput().appendField(label)
      this.setPreviousStatement(true, 'rpStatement')
      this.setNextStatement(true, 'rpStatement')
      this.setColour(color)
      this.setTooltip(tooltip || label)
    },
  }
}

function buildNumericDropdownBlock(type, prefix, fieldName, suffix, color, tooltip) {
  const options = Array.from({ length: 10 }, (_, i) => [String(i), String(i)])
  Blockly.Blocks[type] = {
    init() {
      this.appendDummyInput()
        .appendField(prefix)
        .appendField(new Blockly.FieldDropdown(options), fieldName)
        .appendField(suffix)
      this.appendStatementInput('BODY').setCheck('rpStatement')
      this.setPreviousStatement(true, 'rpStatement')
      this.setNextStatement(true, 'rpStatement')
      this.setColour(color)
      this.setTooltip(tooltip || prefix)
    },
  }
}

function registerBlocks() {
  // ── Stage 1: Countdown ────────────────────────────────────────────────────
  buildFunctionBlock('rp_countdown_function', 'countdown(n)', 200)

  buildNumericDropdownBlock(
    'rp_countdown_if_equals', 'if n <=', 'BASE_N', ':',
    210, '기저 조건: n이 이 값 이하면 재귀를 멈춥니다. 이 블록 안에 return을 넣으세요.',
  )
  buildStatementBlock('rp_countdown_return', 'return  (종료)', 220, '함수를 여기서 끝냅니다')
  buildStatementBlock('rp_countdown_recursive', 'countdown(n - 1)  [재귀 호출]', 230, 'n을 1 줄여서 자기 자신을 다시 호출합니다')

  // ── Stage 2: Factorial ────────────────────────────────────────────────────
  buildFunctionBlock('rp_factorial_function', 'factorial(n)', 280)

  buildNumericDropdownBlock(
    'rp_factorial_if_equals', 'if n ==', 'BASE_N', ':',
    290, '기저 조건: n이 이 값이면 재귀를 멈춥니다. 이 블록 안에 return 값을 넣으세요.',
  )

  // Editable return value — student fills in the base case return value themselves
  Blockly.Blocks['rp_factorial_return_value'] = {
    init() {
      this.appendDummyInput()
        .appendField('return')
        .appendField(new Blockly.FieldTextInput('?'), 'VALUE')
        .appendField('  (기저값 직접 입력)')
      this.setPreviousStatement(true, 'rpStatement')
      this.setNextStatement(true, 'rpStatement')
      this.setColour(300)
      this.setTooltip('기저 조건에서 반환할 값을 입력하세요. 팩토리얼 기저 조건의 반환값은 무엇일까요?')
    },
  }

  buildStatementBlock(
    'rp_factorial_return_recursive', 'return  n * factorial(n - 1)  [재귀]',
    310, '재귀 호출의 반환값에 n을 곱해 반환합니다',
  )

  // ── Stage 3: Quadtree ─────────────────────────────────────────────────────
  buildFunctionBlock('rp_quadtree_function', 'quadtree(x, y, size)', 100)

  buildNumericDropdownBlock(
    'rp_quadtree_if_base', 'if size <=', 'BASE_N', ':',
    110, '기저 조건: 사각형이 이 크기 이하면 더 이상 쪼개지 않습니다',
  )
  buildStatementBlock('rp_quadtree_return', 'return  (분할 종료)', 120, '더 이상 쪼개지 않고 함수를 끝냅니다')
  buildStatementBlock(
    'rp_quadtree_split', '4등분하여 각 사분면 재귀 호출',
    130, 'half = size//2 로 절반씩 나눠 4개 사분면에 재귀합니다',
  )

  // ── Stage 4: Swap/Reverse ─────────────────────────────────────────────────
  buildFunctionBlock('rp_reverse_function', 'reverse(left, right)', 160)
  buildStatementBlock(
    'rp_reverse_if_cross', 'left >= right 이면 → return  (교차 완료)',
    170, '두 포인터가 교차하거나 만나면 뒤집기가 완성됩니다',
  )
  buildStatementBlock('rp_reverse_swap', 'swap(left, right)  [두 원소 교환]', 180, '왼쪽과 오른쪽 원소의 위치를 교환합니다')
  buildStatementBlock(
    'rp_reverse_recursive', 'reverse(left+1, right-1)  [안쪽으로 재귀]',
    190, '포인터를 한 칸씩 안쪽으로 좁히며 재귀합니다',
  )

  // ── Stage 5: Maze DFS ─────────────────────────────────────────────────────
  buildFunctionBlock('rp_maze_function', 'dfs(x, y)', 340)

  buildStatementBlock(
    'rp_maze_if_exit', 'is_exit(x, y) 이면 → return True  [탈출 성공]',
    350, '현재 (x,y)가 출구이면 탈출 성공을 위로 알립니다',
  )
  buildStatementBlock(
    'rp_maze_explore', '이웃 칸 탐색: for (nx,ny) in neighbors\n    dfs 성공 → return True',
    360, 'get_neighbors로 갈 수 있는 칸을 받아 재귀 탐색합니다. 성공하면 True를 전파합니다',
  )
  buildStatementBlock(
    'rp_maze_return_false', 'return False  [이 경로는 막힘 — 백트래킹]',
    370, '모든 방향이 막혔으므로 실패를 위로 알립니다. 재귀가 이전 분기점으로 되돌아갑니다.',
  )

  // ── Stage 6: Hanoi ────────────────────────────────────────────────────────
  buildFunctionBlock('rp_hanoi_function', 'hanoi(n, from_peg, to_peg, aux_peg)', 22)

  buildStatementBlock(
    'rp_hanoi_base_case', 'n == 1 이면: move_disk(from→to) 후 return  [기저]',
    36, '원반이 1개이면 바로 목표 기둥으로 이동합니다',
  )
  buildStatementBlock(
    'rp_hanoi_recursive_left', 'hanoi(n-1) :  from_peg → aux_peg  [n-1개 보조기둥으로]',
    16, 'n-1개의 원반을 보조 기둥으로 먼저 옮겨 맨 아래 원반이 드러나게 합니다',
  )
  buildStatementBlock(
    'rp_hanoi_move_disk', 'move_disk(from_peg → to_peg)  [제일 큰 원반 이동]',
    56, '맨 아래(가장 큰) 원반을 목표 기둥으로 옮깁니다',
  )
  buildStatementBlock(
    'rp_hanoi_recursive_right', 'hanoi(n-1) :  aux_peg → to_peg  [n-1개 목표기둥으로]',
    4, 'n-1개의 원반을 보조 기둥에서 목표 기둥으로 옮깁니다',
  )

  // ── Python code generators ────────────────────────────────────────────────
  const defBlock = (type, fn) => { pythonGenerator.forBlock[type] = fn }

  const defFuncBlock = (type, sig) => {
    pythonGenerator.forBlock[type] = (block, gen) => {
      const body = gen.statementToCode(block, 'BODY') || '    pass\n'
      return `def ${sig}:\n${body}`
    }
  }

  // Stage 1
  defFuncBlock('rp_countdown_function', 'countdown(n)')
  pythonGenerator.forBlock.rp_countdown_if_equals = (block, gen) => {
    const val = block.getFieldValue('BASE_N')
    const body = gen.statementToCode(block, 'BODY') || '    pass\n'
    return `if n <= ${val}:\n${body}`
  }
  defBlock('rp_countdown_return', () => 'return\n')
  defBlock('rp_countdown_recursive', () => 'countdown(n - 1)\n')

  // Stage 2
  defFuncBlock('rp_factorial_function', 'factorial(n)')
  pythonGenerator.forBlock.rp_factorial_if_equals = (block, gen) => {
    const val = block.getFieldValue('BASE_N')
    const body = gen.statementToCode(block, 'BODY') || '    pass\n'
    return `if n == ${val}:\n${body}`
  }
  pythonGenerator.forBlock.rp_factorial_return_value = (block) => {
    const val = block.getFieldValue('VALUE') || '1'
    return `return ${val}\n`
  }
  defBlock('rp_factorial_return_recursive', () => 'return n * factorial(n - 1)\n')

  // Stage 3
  defFuncBlock('rp_quadtree_function', 'quadtree(x, y, size)')
  pythonGenerator.forBlock.rp_quadtree_if_base = (block, gen) => {
    const val = block.getFieldValue('BASE_N')
    const body = gen.statementToCode(block, 'BODY') || '    pass\n'
    return `if size <= ${val}:\n${body}`
  }
  defBlock('rp_quadtree_return', () => 'return\n')
  defBlock('rp_quadtree_split', () =>
    'half = size // 2\nquadtree(x, y, half)\nquadtree(x + half, y, half)\nquadtree(x, y + half, half)\nquadtree(x + half, y + half, half)\n'
  )

  // Stage 4
  defFuncBlock('rp_reverse_function', 'reverse(left, right)')
  defBlock('rp_reverse_if_cross', () => 'if left >= right:\n    return\n')
  defBlock('rp_reverse_swap', () => 'swap(left, right)\n')
  defBlock('rp_reverse_recursive', () => 'reverse(left + 1, right - 1)\n')

  // Stage 5
  defFuncBlock('rp_maze_function', 'dfs(x, y)')
  defBlock('rp_maze_if_exit', () => 'if is_exit(x, y):\n    return True\n')
  defBlock('rp_maze_explore', () =>
    'for nx, ny in get_neighbors(x, y):\n    if dfs(nx, ny):\n        return True\n'
  )
  defBlock('rp_maze_return_false', () => 'return False\n')

  // Stage 6
  defFuncBlock('rp_hanoi_function', 'hanoi(n, from_peg, to_peg, aux_peg)')
  defBlock('rp_hanoi_base_case', () => 'if n == 1:\n    move_disk(from_peg, to_peg)\n    return\n')
  defBlock('rp_hanoi_recursive_left', () => 'hanoi(n - 1, from_peg, aux_peg, to_peg)\n')
  defBlock('rp_hanoi_move_disk', () => 'move_disk(from_peg, to_peg)\n')
  defBlock('rp_hanoi_recursive_right', () => 'hanoi(n - 1, aux_peg, to_peg, from_peg)\n')
}

export function setupBlockly() {
  if (registered) {
    return { Blockly, pythonGenerator }
  }
  registerBlocks()
  registered = true
  return { Blockly, pythonGenerator }
}

export function generateCodeForFunction(workspace, functionBlockType) {
  const functionBlock = workspace.getBlocksByType(functionBlockType, false)[0]
  if (!functionBlock) return ''
  pythonGenerator.init(workspace)
  let code = pythonGenerator.blockToCode(functionBlock)
  if (Array.isArray(code)) [code] = code
  code = pythonGenerator.finish(code)
  pythonGenerator.isInitialized = false
  return code.trim()
}
