import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { deriveFactorialFrames } from '../lib/stageUtils'

function FactorialVisualizerThreeJS({ visibleTrace }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const frameMeshesRef = useRef([])
  const rendererRef = useRef(null)

  const { frames, finalResult } = useMemo(() => deriveFactorialFrames(visibleTrace), [visibleTrace])

  useEffect(() => {
    const mountNode = mountRef.current
    if (!mountNode) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8fbff)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    const stackHeight = frames.length * 1.2
    camera.position.set(0, stackHeight / 2, Math.max(15, stackHeight * 0.8))
    camera.lookAt(0, stackHeight / 2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    mountNode.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    const directional = new THREE.DirectionalLight(0xffffff, 1.2)
    directional.position.set(5, 10, 7)
    directional.castShadow = true
    directional.shadow.mapSize.width = 1024
    directional.shadow.mapSize.height = 1024
    scene.add(ambient, directional)

    const grid = new THREE.GridHelper(20, 20, 0xaaaaaa, 0xdddddd)
    grid.position.y = -0.5
    scene.add(grid)

    frameMeshesRef.current = []

    const colors = [
      0x2563eb, // blue
      0x7c3aed, // purple
      0xdc2626, // red
      0xea580c, // orange
      0x16a34a, // green
    ]

    frames.forEach((frame, index) => {
      const color = colors[index % colors.length]
      const geometry = new THREE.BoxGeometry(1.2, 0.8, 1.2)
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.2,
        emissive: frame.returned ? color : 0x000000,
        emissiveIntensity: frame.returned ? 0.3 : 0,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(0, index * 1.2 + 0.4, 0)

      const textCanvas = document.createElement('canvas')
      textCanvas.width = 256
      textCanvas.height = 128
      const textCtx = textCanvas.getContext('2d')
      if (textCtx) {
        textCtx.fillStyle = '#fff'
        textCtx.font = 'bold 36px Arial'
        textCtx.textAlign = 'center'
        textCtx.textBaseline = 'middle'
        textCtx.fillText(`factorial(${frame.n})`, 128, 40)
        textCtx.font = '24px Arial'
        textCtx.fillText(frame.returned ? `= ${frame.returnValue}` : '...', 128, 90)

        const texture = new THREE.CanvasTexture(textCanvas)
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture })
        const labelGeometry = new THREE.PlaneGeometry(1.5, 0.6)
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
        labelMesh.position.z = 0.65
        mesh.add(labelMesh)
      }

      scene.add(mesh)
      frameMeshesRef.current.push(mesh)
    })

    const resize = () => {
      const width = mountNode.clientWidth
      const height = mountNode.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mountNode)

    let animationId
    let lastRenderTime = Date.now()
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const now = Date.now()
      const shouldAnimate = now - lastRenderTime > 16 // ~60 FPS

      if (shouldAnimate) {
        frameMeshesRef.current.forEach((mesh, i) => {
          mesh.rotation.y += 0.005
          if (frames[i]?.returned) {
            mesh.position.y = i * 1.2 + 0.4 + Math.sin(now * 0.003 + i) * 0.1
          }
        })
        renderer.render(scene, camera)
        lastRenderTime = now
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      renderer.dispose()
      frameMeshesRef.current.forEach((mesh) => {
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if (m.map) m.map.dispose()
            m.dispose()
          })
        } else {
          if (mesh.material.map) mesh.material.map.dispose()
          mesh.material.dispose()
        }
      })
      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement)
      }
    }
  }, [frames])

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        ref={mountRef}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      <div style={{ paddingTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
        {finalResult !== null ? `결과: ${finalResult}` : '실행 중...'}
      </div>
    </div>
  )
}

export default FactorialVisualizerThreeJS
