import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import LearningPath from './components/LearningPath'
import Analytics from './components/Analytics'
import LearningModal from './components/LearningModal'
import Notification from './components/Notification'
import Help from './components/Help'
import Settings from './components/Settings'
import { api } from './api'
import './index.css'

const LEARNER_ID = 'learner_001'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
}

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

function App() {
  const [modal, setModal] = useState({ open: false, item: null, queue: [], index: 0 })
  const [notification, setNotification] = useState(null)
  const [learnerState, setLearnerState] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    try {
      const [state, topicsData] = await Promise.all([
        api.getLearnerState(LEARNER_ID),
        api.getTopics()
      ])
      setLearnerState(state)
      setTopics(topicsData)
    } catch (err) {
      showNotification('Failed to connect to backend', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const openLearningItem = (item, queue = null, index = 0) => {
    const q = queue || [item]
    const i = queue ? index : 0
    setModal({ open: true, item: q[i], queue: q, index: i })
    logEvent(q[i])
  }

  const logEvent = async (item) => {
    try {
      await api.logEvent(LEARNER_ID, {
        interaction_type: 'video_watch',
        item_id: item.item_id || item.id,
        value: 0,
        metadata: { topic_id: item.topic_id }
      })
    } catch (e) {}
  }

  const goToNext = async () => {
    const { queue, index } = modal
    const currentItem = queue[index]
    try { await api.logOutcome(LEARNER_ID, currentItem.item_id || currentItem.id, true, 0.85) } catch (e) {}
    const nextIndex = index + 1
    if (nextIndex < queue.length) {
      const nextItem = queue[nextIndex]
      setModal({ open: true, item: nextItem, queue, index: nextIndex })
      logEvent(nextItem)
      showNotification(`Now: ${nextItem.title}`, 'success')
    } else {
      setModal({ open: false, item: null, queue: [], index: 0 })
      showNotification('Path completed!', 'success')
    }
  }

  const goToPrev = () => {
    const { queue, index } = modal
    const prevIndex = index - 1
    if (prevIndex >= 0) {
      const prevItem = queue[prevIndex]
      setModal({ open: true, item: prevItem, queue, index: prevIndex })
      logEvent(prevItem)
    }
  }

  const closeModal = async () => {
    const { queue, index } = modal
    if (queue.length > 0 && queue[index]) {
      try { await api.logOutcome(LEARNER_ID, queue[index].item_id || queue[index].id, false, 0) } catch (e) {}
    }
    setModal({ open: false, item: null, queue: [], index: 0 })
  }

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Loading AdaptiveFlow...</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Connecting to backend</div>
        </motion.div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<AnimatedPage><Dashboard onOpenItem={openLearningItem} showNotification={showNotification} learnerId={LEARNER_ID} learnerState={learnerState} topics={topics} /></AnimatedPage>} />
              <Route path="/path" element={<AnimatedPage><LearningPath onOpenItem={openLearningItem} showNotification={showNotification} learnerId={LEARNER_ID} /></AnimatedPage>} />
              <Route path="/path/:topicId" element={<AnimatedPage><LearningPath onOpenItem={openLearningItem} showNotification={showNotification} learnerId={LEARNER_ID} /></AnimatedPage>} />
              <Route path="/analytics" element={<AnimatedPage><Analytics showNotification={showNotification} learnerId={LEARNER_ID} /></AnimatedPage>} />
              <Route path="/help" element={<AnimatedPage><Help showNotification={showNotification} /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><Settings showNotification={showNotification} learnerId={LEARNER_ID} /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {modal.open && (
            <LearningModal item={modal.item} queue={modal.queue} index={modal.index}
              onClose={closeModal} onNext={goToNext} onPrev={goToPrev} showNotification={showNotification} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </AnimatePresence>

        <footer className="footer">
          <div className="footer-content">
            <p>AdaptiveFlow Learning System</p>
            <div className="footer-links">
              <a href="/help">Help</a>
              <a href="/settings">Settings</a>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Docs</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App