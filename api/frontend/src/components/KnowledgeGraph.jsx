import { useRef, useEffect, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '../api'
import './KnowledgeGraph.css'

export default function KnowledgeGraph({ learnerId }) {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [topics, setTopics] = useState([])
  const [mastery, setMastery] = useState({})

  useEffect(() => { loadData() }, [learnerId])

  useEffect(() => {
    drawGraph()
    window.addEventListener('resize', drawGraph)
    return () => window.removeEventListener('resize', drawGraph)
  }, [zoom, topics, mastery])

  const loadData = async () => {
    try {
      const [graphData, stateData] = await Promise.all([api.getGraph(), api.getLearnerState(learnerId)])
      const nodePositions = {
        python_basics: { x: 70, y: 50 }, variables: { x: 190, y: 50 }, control_flow: { x: 310, y: 50 },
        functions: { x: 430, y: 50 }, data_structures: { x: 130, y: 140 }, oop: { x: 270, y: 140 },
        error_handling: { x: 410, y: 140 }, file_io: { x: 530, y: 140 }, modules: { x: 200, y: 220 },
        decorators: { x: 350, y: 220 },
      }
      const topicsWithPos = graphData.topics.map(t => ({
        ...t, x: nodePositions[t.id]?.x || 100, y: nodePositions[t.id]?.y || 100,
      }))
      setTopics(topicsWithPos)
      setMastery(stateData.topic_mastery || {})
    } catch (err) { console.error('Failed to load graph:', err) }
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width, h = rect.height
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, w, h)
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-w / 2, -h / 2)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5
    topics.forEach(node => {
      (node.prerequisites || []).forEach(pid => {
        const p = topics.find(n => n.id === pid)
        if (p) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(node.x, node.y); ctx.stroke() }
      })
    })
    topics.forEach(node => {
      const m = mastery[node.id] || 0
      ctx.beginPath(); ctx.arc(node.x, node.y, 20, 0, Math.PI * 2)
      ctx.fillStyle = m >= 0.7 ? '#059669' : m >= 0.4 ? '#d97706' : '#e5e7eb'; ctx.fill()
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke()
      ctx.strokeStyle = m >= 0.7 ? '#059669' : m >= 0.4 ? '#d97706' : '#9ca3af'
      ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = '#111827'; ctx.font = '11px DM Sans'; ctx.textAlign = 'center'
      ctx.fillText(node.name, node.x, node.y + 36)
    })
    ctx.restore()
  }

  return (
    <div className="knowledge-graph-panel">
      <div className="panel-header">
        <h2>Knowledge Map</h2>
        <div className="graph-controls">
          <button className="zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.2))}><ZoomIn size={14} /></button>
          <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut size={14} /></button>
        </div>
      </div>
      <div className="graph-container"><canvas ref={canvasRef} /></div>
      <div className="graph-legend">
        <span className="legend-item"><span className="legend-dot mastered"></span> Mastered</span>
        <span className="legend-item"><span className="legend-dot in-progress"></span> In Progress</span>
        <span className="legend-item"><span className="legend-dot not-started"></span> Not Started</span>
      </div>
    </div>
  )
}