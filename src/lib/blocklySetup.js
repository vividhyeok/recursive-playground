import * as Blockly from 'blockly'
import 'blockly/blocks'
import { pythonGenerator } from 'blockly/python'

let registered = false

function buildFunctionBlock(type, signature, color) {
  Blockly.Blocks[type] = {
    init() {
      this.appendDummyInput()
        .appendField('define')
        .appendField(signature)
      this.appendStatementInput('BODY').setCheck('rpStatement')
      this.setColour(color)
      this.setDeletable(false)
      this.setMovable(false)
      this.setTooltip(`Scaffold for ${signature}`)
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

function registerBlocks() {
  buildFunctionBlock('rp_factorial_function', 'factorial(n)', 204)
  buildFunctionBlock('rp_fibonacci_function', 'fib(n)', 164)
  buildFunctionBlock(
    'rp_hanoi_function',
    'hanoi(n, from_peg, to_peg, aux_peg)',
    22,
  )

  buildStatementBlock('rp_factorial_base_case', 'base case: if n == 1 return 1', 262)
  buildStatementBlock(
    'rp_factorial_recursive_return',
    'recursive call: return n * factorial(n - 1)',
    236,
  )
  buildStatementBlock('rp_fibonacci_base_case', 'base case: if n <= 1 return n', 122)
  buildStatementBlock(
    'rp_fibonacci_recursive_return',
    'recursive split: return fib(n - 1) + fib(n - 2)',
    96,
  )
  buildStatementBlock(
    'rp_hanoi_base_case',
    'base case: move_disk(from_peg, to_peg) and return',
    36,
  )
  buildStatementBlock(
    'rp_hanoi_recursive_left',
    'recursive call: hanoi(n - 1, from_peg, aux_peg, to_peg)',
    16,
  )
  buildStatementBlock('rp_hanoi_move_disk', 'move disk: move_disk(from_peg, to_peg)', 56)
  buildStatementBlock(
    'rp_hanoi_recursive_right',
    'recursive call: hanoi(n - 1, aux_peg, to_peg, from_peg)',
    4,
  )

  pythonGenerator.forBlock.rp_factorial_function = function factorialFunction(
    block,
    generator,
  ) {
    const body = generator.statementToCode(block, 'BODY') || '    pass\n'
    return `def factorial(n):\n${body}`
  }

  pythonGenerator.forBlock.rp_fibonacci_function = function fibonacciFunction(
    block,
    generator,
  ) {
    const body = generator.statementToCode(block, 'BODY') || '    pass\n'
    return `def fib(n):\n${body}`
  }

  pythonGenerator.forBlock.rp_hanoi_function = function hanoiFunction(
    block,
    generator,
  ) {
    const body = generator.statementToCode(block, 'BODY') || '    pass\n'
    return `def hanoi(n, from_peg, to_peg, aux_peg):\n${body}`
  }

  pythonGenerator.forBlock.rp_factorial_base_case = () =>
    '    if n == 1:\n        return 1\n'

  pythonGenerator.forBlock.rp_factorial_recursive_return = () =>
    '    return n * factorial(n - 1)\n'

  pythonGenerator.forBlock.rp_fibonacci_base_case = () =>
    '    if n <= 1:\n        return n\n'

  pythonGenerator.forBlock.rp_fibonacci_recursive_return = () =>
    '    return fib(n - 1) + fib(n - 2)\n'

  pythonGenerator.forBlock.rp_hanoi_base_case = () =>
    '    if n == 1:\n        move_disk(from_peg, to_peg)\n        return\n'

  pythonGenerator.forBlock.rp_hanoi_recursive_left = () =>
    '    hanoi(n - 1, from_peg, aux_peg, to_peg)\n'

  pythonGenerator.forBlock.rp_hanoi_move_disk = () =>
    '    move_disk(from_peg, to_peg)\n'

  pythonGenerator.forBlock.rp_hanoi_recursive_right = () =>
    '    hanoi(n - 1, aux_peg, to_peg, from_peg)\n'
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
  if (!functionBlock) {
    return ''
  }

  pythonGenerator.init(workspace)
  let code = pythonGenerator.blockToCode(functionBlock)
  if (Array.isArray(code)) {
    ;[code] = code
  }
  code = pythonGenerator.finish(code)
  pythonGenerator.isInitialized = false
  return code.trim()
}
