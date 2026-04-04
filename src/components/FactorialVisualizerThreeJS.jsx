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

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    const stackHeight = frames.length * 1.5
    camera.position.set(0, stackHeight / 2, Math.max(30, stackHeight * 1.3))
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

    const grid = new THREE.GridHelper(30, 30, 0xcccccc, 0xeeeeee)
    grid.position.y = -0.5
    scene.add(grid)

    frameMeshesRef.current = []

    frames.forEach((frame, index) => {
      // 단순 회색톤 사용
      const grayShade = 0.3 + (index % 3) * 0.25
      const color = new THREE.Color(grayShade, grayShade, grayShade)
      
      const geometry = new THREE.BoxGeometry(2, 1.2, 2)
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.1,
        emissive: frame.returned ? 0x2563eb : 0x000000,
        emissiveIntensity: frame.returned ? 0.4 : 0,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(0, index * 1.5 + 0.6, 0)

      // 큰 텍스트 캔버스로 가독성 개선
      const textCanvas = document.createElement('canvas')
      textCanvas.width = 512
      textCanvas.height = 256
      const textCtx = textCanvas.getContext('2d')
      if (textCtx) {
        // 검은색 배경 추가
        textCtx.fillStyle = '#000000'
        textCtx.fillRect(0, 0, 512, 256)
        
        // 흰색 텍스트
        textCtx.fillStyle = '#ffffff'
        textCtx.font = 'bold 56px Arial'
        textCtx.textAlign = 'center'
        textCtx.textBaseline = 'middle'
        textCtx.fillText(`factorial(${frame.n})`, 256, 70)
        
        textCtx.font = '42px Arial'
        textCtx.fillStyle = '#64b5f6'
        textCtx.fillText(frame.returned ? `= ${frame.returnValue}` : '...', 256, 160)

        const texture = new THREE.CanvasTexture(textCanvas)
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        const labelGeometry = new THREE.PlaneGeometry(2.2, 1)
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
        labelMesh.position.z = 1.05
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
          // 회전 애니메이션 제거 - 정보 시각화에만 집중
          if (frames[i]?.returned) {
            // 반환된 박스는 살짝 위아래로 움직임
            mesh.position.y = i * 1.5 + 0.6 + Math.sin(now * 0.002 + i) * 0.08
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
