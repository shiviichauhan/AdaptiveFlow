import { useState, useRef, useEffect } from 'react'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'
import { api } from '../api'
import './PerformanceCharts.css'

function drawBarChart(canvas, data, labels) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = rect.height
  const bw = (w - 40) / data.length - 6
  data.forEach((v, i) => {
    const bh = v * (h - 30); const x = 20 + i * (bw + 6); const y = h - bh - 20
    const g = ctx.createLinearGradient(x, y, x, h - 20)
    g.addColorStop(0, '#2563eb'); g.addColorStop(1, '#93c5fd')
    ctx.fillStyle = g; ctx.fillRect(x, y, bw, bh)
  })
  ctx.fillStyle = '#9ca3af'; ctx.font = '10px DM Sans'; ctx.textAlign = 'center'
  labels.forEach((l, i) => { ctx.fillText(l, 20 + i * (bw + 6) + bw / 2, h - 4) })
}

function drawDonutChart(canvas, totalHours) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = rect.height, cx = w / 2, cy = h / 2 - 5
  const r = Math.min(w, h) / 2 - 25
  const data = [{ v: 45, c: '#7c3aed' }, { v: 25, c: '#2563eb' }, { v: 20, c: '#059669' }, { v: 10, c: '#d97706' }]
  let a = -Math.PI / 2
  data.forEach(d => { const sa = (d.v / 100) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + sa); ctx.closePath(); ctx.fillStyle = d.c; ctx.fill(); a += sa })
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill()
  ctx.fillStyle = '#111827'; ctx.font = 'bold 16px JetBrains Mono'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(`${totalHours}h`, cx, cy - 4)
  ctx.fillStyle = '#6b7280'; ctx.font = '11px DM Sans'; ctx.fillText('Total', cx, cy + 14)
}

function drawLineChart(canvas, data) {
  if (!canvas || !data.length) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = rect.height, p = 20
  ctx.beginPath()
  data.forEach((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2); const y = h - p - (v * (h - p * 2))
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.strokeStyle = '#059669'; ctx.lineWidth = 2.5; ctx.stroke()
  ctx.lineTo(w - p, h - p); ctx.lineTo(p, h - p); ctx.closePath()
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgba(5,150,105,0.2)'); g.addColorStop(1, 'rgba(5,150,105,0)')
  ctx.fillStyle = g; ctx.fill()
  data.forEach((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - p * 2); const y = h - p - (v * (h - p * 2))
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill()
    ctx.strokeStyle = '#059669'; ctx.lineWidth = 2; ctx.stroke()
  })
}

export default function PerformanceCharts({ learnerId }) {
  const [activityData, setActivityData] = useState([])
  const [metrics, setMetrics] = useState(null)
  const quizRef = useRef(null)
  const timeRef = useRef(null)
  const masteryRef = useRef(null)

  useEffect(() => { loadData() }, [learnerId])

  useEffect(() => {
    if (metrics) {
      const q = metrics.mastery_achievement || 0
      drawBarChart(quizRef.current, [q*0.8, q*0.85, q*0.9, q*0.95, q, q*0.98, q], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])
      drawDonutChart(timeRef.current, 4.2)
    }
  }, [metrics])

  useEffect(() => {
    if (activityData.length > 0) {
      drawLineChart(masteryRef.current, activityData.slice(0, 7).map(a => a.value || 0.5))
    }
  }, [activityData])

  const loadData = async () => {
    try {
      const [metricsData, activity] = await Promise.all([api.getMetrics(learnerId), api.getActivity(learnerId)])
      setMetrics(metricsData); setActivityData(activity)
    } catch (err) { console.error('Failed to load performance data:', err) }
  }

  return (
    <div className="performance-section">
      <div className="panel-header"><h2>Performance Insights</h2></div>
      <div className="performance-grid">
        <div className="performance-card">
          <div className="card-title"><BarChart3 size={14} /> Quiz Performance</div>
          <div className="chart-container"><canvas ref={quizRef} /></div>
        </div>
        <div className="performance-card">
          <div className="card-title"><PieChart size={14} /> Time Distribution</div>
          <div className="chart-container"><canvas ref={timeRef} /></div>
        </div>
        <div className="performance-card">
          <div className="card-title"><TrendingUp size={14} /> Mastery Progress</div>
          <div className="chart-container"><canvas ref={masteryRef} /></div>
        </div>
      </div>
    </div>
  )
}