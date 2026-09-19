import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Clock, Rocket } from 'lucide-react'
import { api } from '../api'
import './StatsGrid.css'

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
}

export default function StatsGrid({ learnerId, learnerState }) {
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => { api.getAnalytics(learnerId).then(setAnalytics).catch(() => {}) }, [learnerId])

  const mastery = learnerState ? Math.round((Object.values(learnerState.topic_mastery || {}).reduce((a, b) => a + b, 0) / Math.max(Object.keys(learnerState.topic_mastery || {}).length, 1)) * 100) : 0
  const engagement = learnerState ? Math.round(learnerState.engagement_score * 100) : 0
  const timeHours = learnerState ? (learnerState.total_time_spent_minutes / 60).toFixed(1) : '0'
  const velocity = analytics?.learning_velocity || 0.5

  const stats = [
    { id: 'mastery', label: 'Mastery', value: `${mastery}%`, trend: mastery > 50 ? '+' + Math.round(mastery * 0.05) + '%' : '--', trendDir: mastery > 50 ? 'up' : 'neutral', color: 'blue', Icon: TrendingUp },
    { id: 'engagement', label: 'Engagement', value: `${engagement}%`, trend: engagement > 70 ? 'High' : 'Low', trendDir: engagement > 70 ? 'up' : 'neutral', color: 'purple', Icon: Zap },
    { id: 'time', label: 'Time Spent', value: `${timeHours}h`, trend: '--', trendDir: 'neutral', color: 'green', Icon: Clock },
    { id: 'velocity', label: 'Velocity', value: velocity > 0.7 ? 'Fast' : velocity > 0.4 ? 'Med' : 'Slow', trend: velocity > 0.5 ? 'Up' : 'Steady', trendDir: velocity > 0.5 ? 'up' : 'neutral', color: 'orange', Icon: Rocket },
  ]

  return (
    <motion.div className="stats-grid" variants={containerVariants} initial="initial" animate="animate">
      {stats.map(stat => (
        <motion.div key={stat.id} className="stat-card" variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <div className={`stat-icon ${stat.color}`}><stat.Icon size={18} /></div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
          <div className={`stat-trend ${stat.trendDir}`}>{stat.trend}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}