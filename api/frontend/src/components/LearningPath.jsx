import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, TrendingUp, Play, HelpCircle, Code, Check, ChevronRight, Lock } from 'lucide-react'
import { api } from '../api'
import './LearningPath.css'

const typeConfig = {
  video: { icon: Play, color: '#7c3aed', bg: '#ede9fe' },
  quiz: { icon: HelpCircle, color: '#2563eb', bg: '#dbeafe' },
  exercise: { icon: Code, color: '#059669', bg: '#d1fae5' },
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } }
}

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export default function LearningPath({ onOpenItem, showNotification, learnerId }) {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [currentTopic, setCurrentTopic] = useState(topicId || 'data_structures')
  const [pathData, setPathData] = useState([])
  const [topicName, setTopicName] = useState('')
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState([])

  useEffect(() => { api.getTopics().then(setTopics).catch(() => {}) }, [])

  useEffect(() => {
    if (topicId) { setCurrentTopic(topicId); loadPath(topicId) }
  }, [topicId])

  useEffect(() => { if (!topicId) loadPath(currentTopic) }, [])

  const loadPath = async (topic) => {
    setLoading(true)
    try {
      const data = await api.getPath(learnerId, topic)
      setPathData(data.path || [])
      setTopicName(topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    } catch (err) {
      showNotification('Failed to load path', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = () => {
    navigate(`/path/${currentTopic}`)
    loadPath(currentTopic)
    showNotification(`Generating path for: ${currentTopic.replace(/_/g, ' ')}`, 'info')
  }

  const handleItemClick = (item) => {
    onOpenItem(item, pathData, pathData.indexOf(item))
  }

  const getPathStatus = (index) => {
    if (index === 0) return 'current'
    if (index < 2) return 'completed'
    return 'upcoming'
  }

  return (
    <div className="path-view">
      <div className="path-header">
        <h2>Learning Path</h2>
        <p>Follow your personalized route to mastery</p>
      </div>

      <motion.div className="path-target" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="target-selector">
          <Target size={16} className="target-icon" />
          <span>Target:</span>
          <select value={currentTopic} onChange={e => setCurrentTopic(e.target.value)}>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <motion.button className="generate-path-btn" onClick={handleGenerate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <TrendingUp size={14} /> Generate
        </motion.button>
      </motion.div>

      <div className="path-timeline">
        {loading ? (
          <div className="loading-text">Loading path...</div>
        ) : pathData.length === 0 ? (
          <div className="loading-text">No items in path. Select a topic and generate.</div>
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate">
            {pathData.map((item, index) => {
              const status = getPathStatus(index)
              const config = typeConfig[item.content_type] || typeConfig.video
              const Icon = config.icon
              return (
                <motion.div key={item.item_id} className={`path-item ${status}`}
                  variants={itemVariants}
                  whileHover={status !== 'upcoming' ? { x: 4 } : {}}
                  onClick={() => status !== 'upcoming' && handleItemClick(item)}>
                  <div className="path-marker">
                    <div className={`marker-dot ${status}`}>
                      {status === 'completed' ? <Check size={12} /> : status === 'current' ? <div className="marker-pulse" /> : null}
                    </div>
                    {index < pathData.length - 1 && <div className={`marker-line ${status}`}></div>}
                  </div>
                  <div className="path-content">
                    <div className="path-item-header">
                      <div className="path-item-icon" style={{ background: config.bg, color: config.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="path-item-info">
                        <div className="path-item-title">{item.title}</div>
                        <div className="path-item-meta">{item.content_type} · {item.duration} min</div>
                      </div>
                      {status !== 'upcoming' ? (
                        <ChevronRight size={16} className="path-item-arrow" />
                      ) : (
                        <Lock size={14} className="path-item-lock" />
                      )}
                    </div>
                    {status === 'current' && <div className="path-item-badge">Continue</div>}
                    {status === 'upcoming' && <div className="path-item-badge upcoming">Locked</div>}
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