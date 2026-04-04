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
  const moveCount = useMemo(
    () => visibleTrace.filter((event) => event.type === 'move').length,
    [visibleTrace],
  )

  useEffect(() => {
    const mountNode = mountRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x06101f, 18, 33)

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 7.2, 17)
    camera.lookAt(0, 0.3, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountNode.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0x8dc7ff, 1.3)
    const directional = new THREE.DirectionalLight(0xfff1d0, 1.7)
    directional.position.set(7, 12, 8)
    directional.castShadow = true
    directional.shadow.mapSize.width = 1024
    directional.shadow.mapSize.height = 1024
    scene.add(ambient, directional)

    const grid = new THREE.GridHelper(20, 28, 0x3176ff, 0x163354)
    grid.position.y = -1.79
    grid.material.opacity = 0.22
    grid.material.transparent = true
    scene.add(grid)

    const neonRing = new THREE.Mesh(
      new THREE.TorusGeometry(8.5, 0.08, 12, 90),
      new THREE.MeshBasicMaterial({
        color: 0x58b8ff,
        transparent: true,
        opacity: 0.58,
      }),
    )
    neonRing.position.set(0, -1.55, 0)
    neonRing.rotation.x = Math.PI / 2
    scene.add(neonRing)

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(10.5, 0.14, 14, 120, Math.PI),
      new THREE.MeshBasicMaterial({
        color: 0x2dd6c8,
        transparent: true,
        opacity: 0.18,
      }),
    )
    arch.position.set(0, 2.8, -3.4)
    arch.rotation.z = Math.PI
    scene.add(arch)

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 4.4),
      new THREE.MeshStandardMaterial({
        color: 0x503121,
        roughness: 0.82,
        metalness: 0.12,
      }),
    )
    board.position.set(0, -1.8, 0)
    board.receiveShadow = true
    scene.add(board)

    ;['A', 'B', 'C'].forEach((peg) => {
      const pegMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 5.2, 20),
        new THREE.MeshStandardMaterial({
          color: 0xddc18e,
          roughness: 0.58,
          metalness: 0.22,
          emissive: 0x6a4e16,
          emissiveIntensity: 0.22,
        }),
      )
      pegMesh.position.set(PEG_X[peg], 0.55, 0)
      pegMesh.castShadow = true
      pegMesh.receiveShadow = true
      scene.add(pegMesh)

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 20, 20),
        new THREE.MeshBasicMaterial({
          color: peg === 'C' ? 0x45d7a4 : 0x6da8ff,
          transparent: true,
          opacity: 0.72,
        }),
      )
      crown.position.set(PEG_X[peg], 3.15, 0)
      scene.add(crown)
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
          roughness: 0.38,
          metalness: 0.14,
          emissive: diskColors[size],
          emissiveIntensity: 0.14,
          flatShading: true,
        }),
      )
      disk.position.copy(pegPosition('A', index))
      disk.castShadow = true
      disk.receiveShadow = true
      scene.add(disk)
      diskMeshesRef.current.set(size, disk)
    })

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(360 * 3)

    for (let index = 0; index < 360; index += 1) {
      const i = index * 3
      starPositions[i] = (Math.random() - 0.5) * 30
      starPositions[i + 1] = Math.random() * 16 + 2
      starPositions[i + 2] = (Math.random() - 0.5) * 24 - 6
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0x9bd7ff,
        size: 0.12,
        transparent: true,
        opacity: 0.85,
      }),
    )
    scene.add(stars)

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
      const time = performance.now() * 0.00022

      camera.position.x = Math.sin(time) * 0.7
      camera.position.y = 7.2 + Math.cos(time * 1.4) * 0.18
      camera.lookAt(0, 0.3, 0)

      stars.rotation.y += 0.0005
      neonRing.rotation.z += 0.002

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
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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
      <div className="hanoi-stage-wrap">
        <div className="viz-topline">
          <div className="world-chip">HANOI TEMPLE</div>
          <div className="viz-mini-stats">
            <span>이동 {moveCount}</span>
            <span>스택 {callStack.length}</span>
          </div>
        </div>

        <div className="viz-caption">
          원반은 공중 곡선을 그리며 이동하고, 옆 패널의 호출 스택이 같은 템포로 갱신됩니다.
        </div>

        <div className="hanoi-stage" ref={mountRef} />

        <div className="peg-labels">
          <span>A 기둥</span>
          <span>B 기둥</span>
          <span>C 기둥</span>
        </div>
      </div>

      <aside className="hanoi-sidebar">
        <div>
          <h4>실시간 호출 스택</h4>
          <div className="call-stack">
            {callStack.length ? (
              callStack.map((frame) => (
                <div className="call-frame" key={frame.id}>
                  <strong>hanoi({frame.n})</strong>
                  <span>
                    {frame.fromPeg} → {frame.toPeg}, 보조 {frame.auxPeg}
                  </span>
                </div>
              ))
            ) : (
              <div className="call-frame empty">아직 활성화된 재귀 호출이 없습니다.</div>
            )}
          </div>
        </div>

        <div className="peg-summary">
          <h4>현재 기둥 상태</h4>
          <div className="peg-state-grid">
            <div className="peg-state-card">
              <strong>A</strong>
              <span>{simulatedPegs.A.join(', ') || '비어 있음'}</span>
            </div>
            <div className="peg-state-card">
              <strong>B</strong>
              <span>{simulatedPegs.B.join(', ') || '비어 있음'}</span>
            </div>
            <div className="peg-state-card success">
              <strong>C</strong>
              <span>{simulatedPegs.C.join(', ') || '비어 있음'}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default HanoiVisualizer
