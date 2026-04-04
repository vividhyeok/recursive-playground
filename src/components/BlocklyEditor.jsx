import { useEffect, useRef } from 'react'
import { setupBlockly, generateCodeForFunction } from '../lib/blocklySetup'

function BlocklyEditor({ stage, workspaceData, onWorkspaceChange }) {
  const hostRef = useRef(null)
  const workspaceRef = useRef(null)
  const applyingExternalStateRef = useRef(false)
  const initialWorkspaceRef = useRef(workspaceData)
  const serializedWorkspaceRef = useRef('')
  const onWorkspaceChangeRef = useRef(onWorkspaceChange)

  useEffect(() => {
    onWorkspaceChangeRef.current = onWorkspaceChange
  }, [onWorkspaceChange])

  useEffect(() => {
    const { Blockly } = setupBlockly()
    const workspace = Blockly.inject(hostRef.current, {
      toolbox: stage.toolbox,
      trashcan: true,
      move: {
        drag: true,
        wheel: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 1.5,
        minScale: 0.65,
      },
    })

    workspaceRef.current = workspace

    const loadWorkspace = (data) => {
      applyingExternalStateRef.current = true
      workspace.clear()
      Blockly.serialization.workspaces.load(data, workspace)
      const rootFunctionBlock = workspace.getBlocksByType(stage.functionBlockType, false)[0]
      if (rootFunctionBlock && typeof workspace.centerOnBlock === 'function') {
        workspace.centerOnBlock(rootFunctionBlock.id)
      }
      Blockly.svgResize(workspace)
      serializedWorkspaceRef.current = JSON.stringify(
        Blockly.serialization.workspaces.save(workspace),
      )
      applyingExternalStateRef.current = false
    }

    loadWorkspace(initialWorkspaceRef.current)

    const handleChange = (event) => {
      if (applyingExternalStateRef.current) {
        return
      }

      if (event?.isUiEvent) {
        return
      }

      const nextWorkspaceData = Blockly.serialization.workspaces.save(workspace)
      const nextSerialized = JSON.stringify(nextWorkspaceData)

      if (nextSerialized === serializedWorkspaceRef.current) {
        return
      }

      serializedWorkspaceRef.current = nextSerialized

      onWorkspaceChangeRef.current({
        workspaceData: nextWorkspaceData,
        code: generateCodeForFunction(workspace, stage.functionBlockType),
      })
    }

    workspace.addChangeListener(handleChange)

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace)
    })

    resizeObserver.observe(hostRef.current)

    return () => {
      resizeObserver.disconnect()
      workspace.dispose()
    }
  }, [stage])

  useEffect(() => {
    const { Blockly } = setupBlockly()
    const workspace = workspaceRef.current
    if (!workspace) {
      return
    }

    const nextSerialized = JSON.stringify(workspaceData)
    if (nextSerialized === serializedWorkspaceRef.current) {
      return
    }

    applyingExternalStateRef.current = true
    workspace.clear()
    Blockly.serialization.workspaces.load(workspaceData, workspace)
    const rootFunctionBlock = workspace.getBlocksByType(stage.functionBlockType, false)[0]
    if (rootFunctionBlock && typeof workspace.centerOnBlock === 'function') {
      workspace.centerOnBlock(rootFunctionBlock.id)
    }
    Blockly.svgResize(workspace)
    serializedWorkspaceRef.current = JSON.stringify(
      Blockly.serialization.workspaces.save(workspace),
    )
    applyingExternalStateRef.current = false
  }, [workspaceData, stage.functionBlockType])

  return <div className="blockly-host" ref={hostRef} />
}

export default BlocklyEditor
