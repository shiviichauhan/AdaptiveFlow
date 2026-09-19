import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Play, Check, ChevronLeft, ChevronRight, FileCode, HelpCircle } from 'lucide-react'
import './LearningModal.css'

export default function LearningModal({ item, queue, index, onClose, onNext, onPrev, showNotification }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!item) return null

  const isFirst = index === 0
  const isLast = index === queue.length - 1
  const progress = queue.length > 0 ? ((index + 1) / queue.length) * 100 : 0

  return (
    <motion.div className="learning-modal"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="modal-overlay" onClick={onClose}></div>
      <motion.div className="modal-content"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>

        <div className="modal-header">
          <div className="modal-header-left">
            {item.content_type === 'video' && <Play size={16} className="modal-type-icon video" />}
            {item.content_type === 'quiz' && <HelpCircle size={16} className="modal-type-icon quiz" />}
            {item.content_type === 'exercise' && <FileCode size={16} className="modal-type-icon exercise" />}
            <h3>{item.content_type === 'video' ? 'Video Player' : item.content_type === 'quiz' ? 'Quiz' : 'Practice Exercise'}</h3>
            <span className="modal-progress-text">{index + 1}/{queue.length}</span>
          </div>
          <motion.button className="modal-close" onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <X size={16} />
          </motion.button>
        </div>

        <div className="modal-progress-bar">
          <motion.div className="modal-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        </div>

        <div className="modal-body">
          {item.content_type === 'video' && (
            <motion.div className="video-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="video-play-btn"><Play size={32} /></div>
              <p>{item.title}</p>
              <p className="item-id">Topic: {item.topic_id?.replace(/_/g, ' ')}</p>
            </motion.div>
          )}
          {item.content_type === 'quiz' && (
            <motion.div className="quiz-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="quiz-question">
                <span className="q-num">Q1</span>
                <p>Which data structure uses FIFO (First In, First Out)?</p>
              </div>
              <div className="quiz-options">
                {['Stack', 'Queue', 'Array', 'Tree'].map((opt, i) => (
                  <motion.button key={i} className={`quiz-option ${opt === 'Queue' ? 'correct' : ''}`}
                    whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>{opt}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {item.content_type === 'exercise' && (
            <motion.div className="exercise-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="code-block">
                <pre><code>{`# Complete the function
def reverse_list(lst):
    # Your code here
    pass

# Test
print(reverse_list([1, 2, 3]))  # [3, 2, 1]`}</code></pre>
              </div>
              <textarea className="code-input" placeholder="Write your code here..."></textarea>
            </motion.div>
          )}
        </div>

        <div className="modal-footer">
          <motion.button className="modal-btn secondary" onClick={onPrev} disabled={isFirst}
            whileHover={!isFirst ? { x: -2 } : {}} whileTap={!isFirst ? { scale: 0.97 } : {}}>
            <ChevronLeft size={16} /> Prev
          </motion.button>
          <div className="modal-dots">
            {queue.map((_, i) => (
              <motion.span key={i} className={`modal-dot ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
                animate={i === index ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }} />
            ))}
          </div>
          <motion.button className="modal-btn primary" onClick={onNext} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}>
            {isLast ? <><Check size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}