import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown, Keyboard, Wifi, Server, MessageSquare } from 'lucide-react'
import './Help.css'

const faqs = [
  { q: 'How does the recommendation engine work?', a: 'The system uses quiz scores, video watch time, rewatches, and other interaction signals to model your learning state. It then recommends items based on mastery gaps, prerequisites, and engagement patterns.' },
  { q: 'What is the Knowledge Graph?', a: 'The Knowledge Graph maps relationships between topics and their prerequisites. It ensures you learn foundational concepts before advanced ones, and helps identify the optimal learning path.' },
  { q: 'How is mastery calculated?', a: 'Mastery is calculated from quiz scores, exercise completion, and video engagement. Each interaction updates your mastery score using a weighted formula that considers recency and consistency.' },
  { q: 'What do the difficulty levels mean?', a: 'Difficulty ranges from Beginner (1) to Expert (5). The system adjusts difficulty based on your recent performance - if you are scoring high, it recommends harder content.' },
  { q: 'How do I reset my progress?', a: 'Go to Settings and click "Reset Progress". This will clear all your learning data and start fresh. This action cannot be undone.' },
  { q: 'Can I change my target topic?', a: 'Yes, go to the Learning Path view and select a different target topic from the dropdown. The system will generate a new personalized path.' },
]

const shortcuts = [
  { key: 'Esc', action: 'Close modal / Exit' },
  { key: '1', action: 'Go to Dashboard' },
  { key: '2', action: 'Go to Learning Path' },
  { key: '3', action: 'Go to Analytics' },
  { key: 'R', action: 'Refresh recommendations' },
]

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

export default function Help({ showNotification }) {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <motion.div className="help-view" variants={containerVariants} initial="initial" animate="animate">
      <motion.div className="help-header" variants={itemVariants}>
        <h2>Help Center</h2>
        <p>Everything you need to know about AdaptiveFlow</p>
      </motion.div>

      <div className="help-grid">
        <motion.div className="help-section" variants={itemVariants}>
          <div className="section-title"><HelpCircle size={16} /> FAQs</div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <motion.div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} variants={itemVariants}>
                <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="help-right">
          <motion.div className="help-section" variants={itemVariants}>
            <div className="section-title"><Keyboard size={16} /> Shortcuts</div>
            <div className="shortcuts-list">
              {shortcuts.map((s, i) => (
                <motion.div key={i} className="shortcut-item" variants={itemVariants} whileHover={{ x: 4 }}>
                  <kbd>{s.key}</kbd>
                  <span>{s.action}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="help-section" variants={itemVariants}>
            <div className="section-title"><Wifi size={16} /> System Status</div>
            <div className="status-list">
              <div className="status-item"><span className="status-dot online"></span><span>Backend API</span><span className="status-badge online">Online</span></div>
              <div className="status-item"><span className="status-dot online"></span><span>Recommendations</span><span className="status-badge online">Active</span></div>
              <div className="status-item"><span className="status-dot online"></span><span>Knowledge Graph</span><span className="status-badge online">12 topics</span></div>
            </div>
          </motion.div>

          <motion.div className="help-section" variants={itemVariants}>
            <div className="section-title"><Server size={16} /> API Info</div>
            <div className="api-info">
              <div className="api-row"><span>Base URL</span><code>localhost:8000/api/v1</code></div>
              <div className="api-row"><span>Docs</span><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">Swagger UI</a></div>
              <div className="api-row"><span>Version</span><code>1.0.0</code></div>
            </div>
          </motion.div>

          <motion.div className="help-section" variants={itemVariants}>
            <div className="section-title"><MessageSquare size={16} /> Support</div>
            <div className="support-info">
              <p>Found a bug or need help?</p>
              <motion.button className="support-btn" onClick={() => showNotification('Support ticket created!', 'success')}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Report Issue
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}