import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, Activity } from 'lucide-react'
import { api } from '../api'
import './Analytics.css'

function drawActivityChart(canvas, data) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = rect.height, pad = 30
  const chartData = data.length > 0 ? data : [45, 60, 35, 80, 55, 70, 90]
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = pad + (i / 4) * (h - pad * 2)
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px DM Sans'; ctx.textAlign = 'right'
    ctx.fillText(`${100 - i * 25}%`, pad - 8, y + 4)
  }
  const bw = (w - pad * 2) / chartData.length - 12
  chartData.forEach((v, i) => {
    const bh = (v / 100) * (h - pad * 2)
    const x = pad + i * (bw + 12) + 6
    const y = h - pad - bh
    const g = ctx.createLinearGradient(x, y, x, h - pad)
    g.addColorStop(0, '#2563eb'); g.addColorStop(1, '#93c5fd')
    ctx.fillStyle = g; ctx.fillRect(x, y, bw, bh)
  })
  ctx.fillStyle = '#9ca3af'; ctx.font = '10px DM Sans'; ctx.textAlign = 'center'
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  labels.forEach((d, i) => {
    ctx.fillText(d, pad + i * (bw + 12) + bw / 2 + 6, h - 10)
  })
}

function ActivityChart({ activityData }) {
  const ref = useRef(null)
  useEffect(() => {
    const chartData = activityData.map(a => {
      if (a.type === 'quiz_attempt') return Math.round(a.value * 100)
      if (a.type === 'video_watch') return Math.round((a.value / 3600) * 100)
      return 50
    })
    const paddedData = chartData.length < 7 
      ? [...chartData, ...Array(7 - chartData.length).fill(50)]
      : chartData.slice(0, 7)
    const timer = setTimeout(() => drawActivityChart(ref.current, paddedData), 100)
    const h = () => drawActivityChart(ref.current, paddedData)
    window.addEventListener('resize', h)
    return () => { clearTimeout(timer); window.removeEventListener('resize', h) }
  }, [activityData])
  return <canvas ref={ref} />
}

function getMasteryColor(m) {
  if (m >= 0.7) return '#059669'
  if (m >= 0.4) return '#d97706'
  return '#dc2626'
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

export default function Analytics({ showNotification, learnerId }) {
  const [period, setPeriod] = useState('week')
  const [metrics, setMetrics] = useState(null)
  const [topics, setTopics] = useState([])
  const [mastery, setMastery] = useState({})
  const [activity, setActivity] = useState([])

  useEffect(() => { loadData() }, [learnerId])

  const loadData = async () => {
    try {
      const [metricsData, stateData, topicsData, activityData] = await Promise.all([
        api.getMetrics(learnerId), api.getLearnerState(learnerId), api.getTopics(), api.getActivity(learnerId),
      ])
      setMetrics(metricsData)
      setMastery(stateData.topic_mastery || {})
      setTopics(topicsData)
      setActivity(activityData)
    } catch (err) { console.error('Failed to load analytics:', err) }
  }

  const handlePeriodChange = (p) => {
    setPeriod(p)
    showNotification(`Showing ${p} data`, 'info')
  }

  const stats = [
    { label: 'Completion', value: `${Math.round((metrics?.completion_rate || 0) * 100)}%`, fill: (metrics?.completion_rate || 0) * 100, color: '#2563eb', Icon: BarChart3 },
    { label: 'Mastery', value: `${Math.round((metrics?.mastery_achievement || 0) * 100)}%`, fill: (metrics?.mastery_achievement || 0) * 100, color: '#7c3aed', Icon: Activity },
    { label: 'Engagement', value: `${Math.round((metrics?.engagement_score || 0) * 100)}%`, fill: (metrics?.engagement_score || 0) * 100, color: '#059669', Icon: Activity },
    { label: 'Efficiency', value: (metrics?.time_efficiency || 0).toFixed(2), fill: (metrics?.time_efficiency || 0) * 100, color: '#d97706', Icon: Clock },
    { label: 'Retention', value: `${Math.round((metrics?.retention_rate || 0) * 100)}%`, fill: (metrics?.retention_rate || 0) * 100, color: '#dc2626', Icon: Activity },
  ]

  const topicMastery = topics.map(t => ({ name: t.name, mastery: mastery[t.id] || 0 }))

  const formatTime = (iso) => {
    if (!iso) return ''
    const diff = Math.floor((new Date() - new Date(iso)) / 1000)
    if (diff < 60) return 'Now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  const formatType = (type) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <motion.div className="analytics-view" variants={containerVariants} initial="initial" animate="animate">
      <motion.div className="analytics-header" variants={itemVariants}>
        <h2>Analytics</h2>
        <div className="analytics-period">
          {['week', 'month', 'all'].map(p => (
            <motion.button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => handlePeriodChange(p)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {p === 'week' ? '7D' : p === 'month' ? '30D' : 'All'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="analytics-stats" variants={containerVariants}>
        {stats.map((stat, i) => (
          <motion.div key={i} className="analytics-stat-card" variants={itemVariants} whileHover={{ y: -2 }}>
            <div className="analytics-stat-header">
              <stat.Icon size={14} style={{ color: stat.color }} />
              <span className="analytics-stat-label">{stat.label}</span>
            </div>
            <div className="analytics-stat-value">{stat.value}</div>
            <div className="analytics-stat-bar">
              <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(stat.fill, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }} style={{ background: stat.color }} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="analytics-charts" variants={itemVariants}>
        <div className="analytics-chart-card">
          <h3>Activity Timeline</h3>
          <ActivityChart activityData={activity} />
        </div>
        <div className="analytics-chart-card">
          <h3>Topic Mastery</h3>
          <div className="mastery-breakdown">
            {topicMastery.map((topic, i) => (
              <div key={i} className="mastery-row">
                <span className="mastery-topic">{topic.name}</span>
                <div className="mastery-bar-container">
                  <motion.div className="mastery-bar-fill" initial={{ width: 0 }} animate={{ width: `${topic.mastery * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }} style={{ background: getMasteryColor(topic.mastery) }} />
                </div>
                <span className="mastery-value">{Math.round(topic.mastery * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className="analytics-history" variants={itemVariants}>
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {activity.length === 0 ? (
            <div className="loading-text">No activity recorded</div>
          ) : (
            activity.slice(0, 5).map((act, i) => (
              <motion.div key={i} className="activity-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="activity-time">{formatTime(act.time)}</div>
                <div className="activity-action">{formatType(act.type)}</div>
                <div className="activity-item-name">{act.topic_id?.replace(/_/g, ' ') || act.item_id}</div>
                <div className="activity-result">{act.type === 'video_watch' ? `${Math.round(act.value / 60)}m` : `${Math.round(act.value * 100)}%`}</div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}