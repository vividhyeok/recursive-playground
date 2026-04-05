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
      this.setTooltip(`${signature} 함수 뼈대`)
    },
  }
}

function buildStatementBlock(type, label, color) {
  Blockly.Blocks[type] = {
    init() {
      this.appendDummyInput().appendField(label)
      this.setPreviousStatement(true, 'rpStatement')
      this.setNextStatement(true, 'rpStatement')
      this.setColour(color)
      this.setTooltip(label)
    },
  }
}

function buildNumericDropdownBlock(type, prefix, fieldName, suffix, color) {
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
    },
  }
}

function registerBlocks() {
  // --- Stage 1: Countdown ---
  buildFunctionBlock('rp_countdown_function', 'countdown(n)', 200)
  buildNumericDropdownBlock('rp_countdown_if_equals', 'if n <=', 'BASE_N', ':', 210)
  buildStatementBlock('rp_countdown_return', 'return', 220)
  buildStatementBlock('rp_countdown_recursive', 'countdown(n - 1)', 230)

  // --- Stage 2: Factorial ---
  buildFunctionBlock('rp_factorial_function', 'factorial(n)', 280)
  buildNumericDropdownBlock('rp_factorial_if_equals', 'if n ==', 'BASE_N', ':', 290)
  buildStatementBlock('rp_factorial_return_const', 'return 1', 300)
  buildStatementBlock('rp_factorial_return_recursive', 'return n * factorial(n - 1)', 310)

  // --- Stage 3: Quadtree ---
  buildFunctionBlock('rp_quadtree_function', 'quadtree(x, y, size)', 100)
  buildNumericDropdownBlock('rp_quadtree_if_base', 'if size <=', 'BASE_N', ':', 110)
  buildStatementBlock('rp_quadtree_return', 'return', 120)
  buildStatementBlock('rp_quadtree_split', '4등분 분할 재귀호출', 130)

  // --- Stage 4: Swap Reverse ---
  buildFunctionBlock('rp_reverse_function', 'reverse(left, right)', 160)
  buildStatementBlock('rp_reverse_if_cross', 'if left >= right:\n    return', 170)
  buildStatementBlock('rp_reverse_swap', 'swap(left, right)', 180)
  buildStatementBlock('rp_reverse_recursive', 'reverse(left + 1, right - 1)', 190)

  // --- Stage 5: Maze DFS ---
  buildFunctionBlock('rp_maze_function', 'dfs(x, y)', 340)
  buildStatementBlock('rp_maze_if_exit', 'if is_exit(x, y):\n    return True', 350)
  buildStatementBlock('rp_maze_explore', '상하좌우 탐색', 360)

  // --- Stage 6: Hanoi ---
  buildFunctionBlock('rp_hanoi_function', 'hanoi(n, from_p, to_p, aux_p)', 22)
  buildStatementBlock('rp_hanoi_base_case', 'if n == 1:\n    move_disk(from_p, to_p)\n    return', 36)
  buildStatementBlock('rp_hanoi_recursive_left', 'hanoi(n - 1, from_p, aux_p, to_p)', 16)
  buildStatementBlock('rp_hanoi_move_disk', 'move_disk(from_p, to_p)', 56)
  buildStatementBlock('rp_hanoi_recursive_right', 'hanoi(n - 1, aux_p, to_p, from_p)', 4)


  const defBlock = (type, pyCode) => {
    pythonGenerator.forBlock[type] = pyCode
  }

  const defFuncBlock = (type, signature) => {
    pythonGenerator.forBlock[type] = (block, gen) => {
      const body = gen.statementToCode(block, 'BODY') || '    pass\n'
      return `def ${signature}:\n${body}`
    }
  }

  defFuncBlock('rp_countdown_function', 'countdown(n)')
  pythonGenerator.forBlock.rp_countdown_if_equals = (block, gen) => {
    const val = block.getFieldValue('BASE_N')
    const body = gen.statementToCode(block, 'BODY') || '    pass\n'
    return `if n <= ${val}:\n${body}`
  }
  defBlock('rp_countdown_return', () => 'return\n')
  defBlock('rp_countdown_recursive', () => 'countdown(n - 1)\n')

  defFuncBlock('rp_factorial_function', 'factorial(n)')
  pythonGenerator.forBlock.rp_factorial_if_equals = (block, gen) => {
    const val = block.getFieldValue('BASE_N')
    const body = gen.statementToCode(block, 'BODY') || '    pass\n'
    return `if n == ${val}:\n${body}`
  }
  defBlock('rp_factorial_return_const', () => 'return 1\n')
  defBlock('rp_factorial_return_recursive', () => 'return n * factorial(n - 1)\n')

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

  defFuncBlock('rp_reverse_function', 'reverse(left, right)')
  defBlock('rp_reverse_if_cross', () => 'if left >= right:\n    return\n')
  defBlock('rp_reverse_swap', () => 'swap(left, right)\n')
  defBlock('rp_reverse_recursive', () => 'reverse(left + 1, right - 1)\n')

  defFuncBlock('rp_maze_function', 'dfs(x, y)')
  defBlock('rp_maze_if_exit', () => 'if is_exit(x, y):\n    return True\n')
  defBlock('rp_maze_explore', () => 
    'for nx, ny in get_neighbors(x, y):\n    if dfs(nx, ny):\n        return True\nreturn False\n'
  )

  defFuncBlock('rp_hanoi_function', 'hanoi(n, from_p, to_p, aux_p)')
  defBlock('rp_hanoi_base_case', () => 'if n == 1:\n    move_disk(from_p, to_p)\n    return\n')
  defBlock('rp_hanoi_recursive_left', () => 'hanoi(n - 1, from_p, aux_p, to_p)\n')
  defBlock('rp_hanoi_move_disk', () => 'move_disk(from_p, to_p)\n')
  defBlock('rp_hanoi_recursive_right', () => 'hanoi(n - 1, aux_p, to_p, from_p)\n')
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
