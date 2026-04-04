import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { deriveHanoiCallStack, simulateHanoi } from '../lib/stageUtils'

const PEG_X = {
  A: -5.6,
  B: 0,
  C: 5.6,
}

const DISK_HEIGHT = 0.68
const BASE_Y = -1.45

function diskRadius(size) {
  return 1.5 + size * 0.8
}

function pegPosition(peg, stackIndex) {
  return new THREE.Vector3(PEG_X[peg], BASE_Y + stackIndex * DISK_HEIGHT, 0)
}

function HanoiVisualizer({ visibleTrace, fullTrace, executionId, moveDuration }) {
  const mountRef = useRef(null)
  const diskMeshesRef = useRef(new Map())
  const pegStacksRef = useRef({ A: [3, 2, 1], B: [], C: [] })
  const eventCursorRef = useRef(0)
  const queueRef = useRef([])
  const activeAnimationRef = useRef(null)
  const rafRef = useRef(null)

  const callStack = useMemo(() => deriveHanoiCallStack(visibleTrace), [visibleTrace])
  const simulatedPegs = useMemo(() => simulateHanoi(fullTrace), [fullTrace])

  useEffect(() => {
    const mountNode = mountRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 7.2, 17)
    camera.lookAt(0, 0.2, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountNode.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xf1ede4, 1.6)
    const directional = new THREE.DirectionalLight(0xfff4d7, 1.4)
    directional.position.set(6, 12, 8)
    scene.add(ambient, directional)

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 4.4),
      new THREE.MeshStandardMaterial({
        color: 0x5a3d2b,
        roughness: 0.84,
        metalness: 0.1,
      }),
    )
    board.position.set(0, -1.8, 0)
    scene.add(board)

    ;['A', 'B', 'C'].forEach((peg) => {
      const pegMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 5.2, 20),
        new THREE.MeshStandardMaterial({
          color: 0xd1b484,
          roughness: 0.6,
          metalness: 0.2,
        }),
      )
      pegMesh.position.set(PEG_X[peg], 0.55, 0)
      scene.add(pegMesh)
    })

    const diskColors = {
      1: 0x4b93ff,
      2: 0xff8b47,
      3: 0x45c4a0,
    }

    ;[3, 2, 1].forEach((size, index) => {
      const disk = new THREE.Mesh(
        new THREE.CylinderGeometry(diskRadius(size), diskRadius(size), DISK_HEIGHT, 48),
        new THREE.MeshStandardMaterial({
          color: diskColors[size],
          roughness: 0.5,
          metalness: 0.08,
          flatShading: true,
        }),
      )
      disk.position.copy(pegPosition('A', index))
      scene.add(disk)
      diskMeshesRef.current.set(size, disk)
    })

    const resize = () => {
      const width = mountNode.clientWidth
      const height = mountNode.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mountNode)

    const tick = () => {
      const animation = activeAnimationRef.current
      if (animation) {
        const elapsed = performance.now() - animation.startedAt
        const progress = Math.min(1, elapsed / animation.duration)
        const x = THREE.MathUtils.lerp(animation.start.x, animation.end.x, progress)
        const z = THREE.MathUtils.lerp(animation.start.z, animation.end.z, progress)
        const peak = Math.max(animation.start.y, animation.end.y) + 4.2
        const y = THREE.MathUtils.lerp(
          THREE.MathUtils.lerp(animation.start.y, peak, progress),
          THREE.MathUtils.lerp(peak, animation.end.y, progress),
          progress,
        )

        animation.mesh.position.set(x, y, z)

        if (progress >= 1) {
          animation.mesh.position.copy(animation.end)
          pegStacksRef.current[animation.to].push(animation.disk)
          activeAnimationRef.current = null
        }
      }

      if (!activeAnimationRef.current && queueRef.current.length) {
        const nextMove = queueRef.current.shift()
        const sourceStack = pegStacksRef.current[nextMove.from]
        const disk = sourceStack.pop()

        if (disk != null) {
          const mesh = diskMeshesRef.current.get(disk)
          const start = mesh.position.clone()
          const end = pegPosition(nextMove.to, pegStacksRef.current[nextMove.to].length)
          activeAnimationRef.current = {
            disk,
            mesh,
            to: nextMove.to,
            start,
            end,
            startedAt: performance.now(),
            duration: moveDuration,
          }
        }
      }

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(rafRef.current)
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      mountNode.removeChild(renderer.domElement)
    }
  }, [moveDuration])

  useEffect(() => {
    eventCursorRef.current = 0
    queueRef.current = []
    activeAnimationRef.current = null
    pegStacksRef.current = { A: [3, 2, 1], B: [], C: [] }

    diskMeshesRef.current.forEach((mesh, size) => {
      const index = 3 - size
      mesh.position.copy(pegPosition('A', index))
    })
  }, [executionId])

  useEffect(() => {
    const newEvents = visibleTrace.slice(eventCursorRef.current)
    eventCursorRef.current = visibleTrace.length

    newEvents.forEach((event) => {
      if (event.type === 'move') {
        queueRef.current.push(event)
      }
    })
  }, [visibleTrace])

  return (
    <div className="hanoi-viz">
      <div className="hanoi-stage" ref={mountRef} />
      <aside className="hanoi-sidebar">
        <div>
          <h4>Live Call Stack</h4>
          <div className="call-stack">
            {callStack.length ? (
              callStack.map((frame) => (
                <div className="call-frame" key={frame.id}>
                  <strong>hanoi({frame.n})</strong>
                  <span>
                    {frame.fromPeg} → {frame.toPeg} via {frame.auxPeg}
                  </span>
                </div>
              ))
            ) : (
              <div className="call-frame empty">No active recursive calls yet.</div>
            )}
          </div>
        </div>
        <div className="peg-summary">
          <h4>Current End State</h4>
          <p>A: {simulatedPegs.A.join(', ') || 'empty'}</p>
          <p>B: {simulatedPegs.B.join(', ') || 'empty'}</p>
          <p>C: {simulatedPegs.C.join(', ') || 'empty'}</p>
        </div>
      </aside>
    </div>
  )
}

export default HanoiVisualizer
