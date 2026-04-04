function numeric(value) {
  return Number(value)
}

export function deriveFactorialFrames(events) {
  const frames = []
  const stack = []

  events.forEach((event, index) => {
    if (event.type === 'call') {
      const frame = {
        id: `${index}-${event.args.n}`,
        n: numeric(event.args.n),
        depth: event.depth ?? stack.length + 1,
        returnValue: null,
        returned: false,
      }
      stack.push(frame)
      frames.push(frame)
      return
    }

    if (event.type === 'return') {
      const frame = stack.pop()
      if (frame) {
        frame.returnValue = numeric(event.value)
        frame.returned = true
      }
    }
  })

  return {
    frames,
    finalResult:
      [...events]
        .reverse()
        .find((event) => event.type === 'return' && event.func === 'factorial')
        ?.value ?? null,
  }
}

function layoutTree(node, depth, cursor) {
  if (!node) {
    return cursor
  }

  node.depth = depth

  if (!node.children.length) {
    node.layoutX = cursor
    return cursor + 1
  }

  let nextCursor = cursor
  node.children.forEach((child) => {
    nextCursor = layoutTree(child, depth + 1, nextCursor)
  })

  node.layoutX =
    (node.children[0].layoutX + node.children[node.children.length - 1].layoutX) / 2

  return nextCursor
}

export function deriveFibonacciTree(events) {
  let root = null
  const stack = []
  const nodes = []

  events.forEach((event, index) => {
    if (event.type === 'call') {
      const node = {
        id: `${index}-${event.args.n}`,
        n: numeric(event.args.n),
        value: null,
        returned: false,
        duplicate: false,
        children: [],
      }

      if (stack.length) {
        stack[stack.length - 1].children.push(node)
      } else {
        root = node
      }

      stack.push(node)
      nodes.push(node)
      return
    }

    if (event.type === 'return') {
      const node = stack.pop()
      if (node) {
        node.returned = true
        node.value = numeric(event.value)
      }
    }
  })

  const seenCounts = nodes.reduce((accumulator, node) => {
    accumulator[node.n] = (accumulator[node.n] ?? 0) + 1
    return accumulator
  }, {})

  nodes.forEach((node) => {
    node.duplicate = (seenCounts[node.n] ?? 0) > 1
  })

  layoutTree(root, 0, 0)

  const leafCount = Math.max(
    1,
    ...nodes.map((node) => Math.ceil(node.layoutX ?? 0) + 1),
  )

  return { nodes, leafCount }
}

export function simulateHanoi(trace, diskCount = 3) {
  const pegs = {
    A: Array.from({ length: diskCount }, (_, index) => diskCount - index),
    B: [],
    C: [],
  }

  trace
    .filter((event) => event.type === 'move')
    .forEach((move) => {
      const disk = pegs[move.from].pop()
      if (disk == null) {
        return
      }
      pegs[move.to].push(disk)
    })

  return pegs
}

export function deriveHanoiCallStack(events) {
  const stack = []

  events.forEach((event, index) => {
    if (event.type === 'call' && event.func === 'hanoi') {
      stack.push({
        id: `${index}-${event.args.n}`,
        n: numeric(event.args.n),
        fromPeg: event.args.from_peg,
        toPeg: event.args.to_peg,
        auxPeg: event.args.aux_peg,
      })
      return
    }

    if (event.type === 'return' && event.func === 'hanoi') {
      stack.pop()
    }
  })

  return stack.reverse()
}
