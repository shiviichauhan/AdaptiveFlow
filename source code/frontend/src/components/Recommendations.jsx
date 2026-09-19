import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, HelpCircle, Code, RefreshCw, ChevronRight } from 'lucide-react'
import { api } from '../api'
import './Recommendations.css'

const typeConfig = {
  video: { icon: Play, color: '#7c3aed', bg: '#ede9fe' },
  quiz: { icon: HelpCircle, color: '#2563eb', bg: '#dbeafe' },
  exercise: { icon: Code, color: '#059669', bg: '#d1fae5' },
}

const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export default function Recommendations({ onOpenItem, showNotification, learnerId }) {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRecs = async () => {
    setLoading(true)
    try {
      const data = await api.getRecommendations(learnerId, 5)
      setRecs(data)
    } catch (err) {
      showNotification('Failed to load recommendations', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecs() }, [learnerId])

  const handleRefresh = () => {
    loadRecs()
    showNotification('Recommendations refreshed', 'success')
  }

  return (
    <div className="recommendations-panel">
      <div className="panel-header">
        <h2>Recommended Next</h2>
        <motion.button className="refresh-btn" onClick={handleRefresh} whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}>
          <RefreshCw size={14} /> Refresh
        </motion.button>
      </div>
      <div className="recommendations-list">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : recs.length === 0 ? (
          <div className="loading-text">No recommendations</div>
        ) : (
          <motion.div variants={listVariants} initial="initial" animate="animate">
            {recs.map(rec => {
              const config = typeConfig[rec.content_type] || typeConfig.video
              const Icon = config.icon
              return (
                <motion.div key={rec.item_id} className="recommendation-item" variants={itemVariants}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenItem(rec)}>
                  <div className="rec-icon" style={{ background: config.bg, color: config.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="rec-content">
                    <div className="rec-title">{rec.title}</div>
                    <div className="rec-reason">{rec.reason} · {rec.duration} min</div>
                  </div>
                  <div className="rec-right">
                    <div className="rec-score">{Math.round(rec.score * 100)}%</div>
                    <ChevronRight size={14} className="rec-arrow" />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}