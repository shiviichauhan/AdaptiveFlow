import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { api } from '../api'
import './WeakAreas.css'

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

export default function WeakAreas({ onOpenItem, showNotification, learnerId, learnerState }) {
  const navigate = useNavigate()
  const [weakAreas, setWeakAreas] = useState([])

  useEffect(() => {
    if (learnerState) {
      const mastery = learnerState.topic_mastery || {}
      const weak = Object.entries(mastery)
        .filter(([, v]) => v < 0.6)
        .sort((a, b) => a[1] - b[1])
        .map(([id, m]) => ({
          id,
          topic: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          mastery: m,
        }))
      setWeakAreas(weak.slice(0, 4))
    }
  }, [learnerState])

  const handleStartLearning = (topicId) => {
    navigate(`/path/${topicId}`)
    showNotification(`Loading: ${topicId.replace(/_/g, ' ')}`, 'info')
  }

  return (
    <div className="weak-areas-section">
      <div className="panel-header">
        <div className="panel-header-left">
          <AlertTriangle size={16} className="panel-icon" />
          <h2>Areas Needing Attention</h2>
        </div>
      </div>
      <motion.div className="weak-areas-list" variants={containerVariants} initial="initial" animate="animate">
        {weakAreas.length === 0 ? (
          <div className="empty-text">No weak areas found</div>
        ) : (
          weakAreas.map(area => (
            <motion.div key={area.id} className="weak-area-card" variants={itemVariants}
              whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <div className="weak-area-top">
                <div className="weak-area-topic">{area.topic}</div>
                <div className="mastery-percent">{Math.round(area.mastery * 100)}%</div>
              </div>
              <div className="weak-area-mastery">
                <div className="mastery-bar">
                  <motion.div className="mastery-fill" initial={{ width: 0 }} animate={{ width: `${area.mastery * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }} />
                </div>
              </div>
              <motion.div className="weak-area-action" onClick={() => handleStartLearning(area.id)} whileHover={{ x: 4 }}>
                Start Learning <ArrowRight size={14} />
              </motion.div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}