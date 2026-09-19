import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Gauge, Server, AlertTriangle } from "lucide-react";
import { api } from "../api";
import "./Settings.css";

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Settings({ showNotification, learnerId }) {
  const [name, setName] = useState("Student name");
  const [email, setEmail] = useState("student@example.com");
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [difficulty, setDifficulty] = useState("auto");
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api/v1");
  const [learnerState, setLearnerState] = useState(null);

  useEffect(() => {
    api
      .getLearnerState(learnerId)
      .then(setLearnerState)
      .catch(() => {});
  }, [learnerId]);

  const handleSave = () => {
    showNotification("Settings saved successfully", "success");
  };
  const handleReset = () => {
    if (confirm("Reset all progress? This cannot be undone."))
      showNotification("Progress reset", "success");
  };
  const handleTestApi = async () => {
    try {
      await api.getLearnerState(learnerId);
      showNotification("API connected", "success");
    } catch (e) {
      showNotification("API connection failed", "error");
    }
  };

  return (
    <motion.div
      className="settings-view"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div className="settings-header" variants={itemVariants}>
        <h2>Settings</h2>
        <p>Manage your account and preferences</p>
      </motion.div>

      <div className="settings-grid">
        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-title">
            <User size={16} /> Profile
          </div>
          <div className="setting-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>Learner ID</label>
            <input type="text" value={learnerId} disabled />
          </div>
        </motion.div>

        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-title">
            <Bell size={16} /> Preferences
          </div>
          <div className="setting-toggle">
            <div className="toggle-info">
              <span className="toggle-label">Notifications</span>
              <span className="toggle-desc">
                Get notified about new recommendations
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-toggle">
            <div className="toggle-info">
              <span className="toggle-label">Auto-advance</span>
              <span className="toggle-desc">
                Load next item after completion
              </span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-group">
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="auto">Auto (Recommended)</option>
              <option value="1">Beginner</option>
              <option value="2">Elementary</option>
              <option value="3">Intermediate</option>
              <option value="4">Advanced</option>
              <option value="5">Expert</option>
            </select>
          </div>
        </motion.div>

        <motion.div className="settings-section" variants={itemVariants}>
          <div className="section-title">
            <Server size={16} /> API
          </div>
          <div className="setting-group">
            <label>Backend URL</label>
            <div className="input-with-btn">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <motion.button
                className="test-btn"
                onClick={handleTestApi}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Test
              </motion.button>
            </div>
          </div>
          <div className="api-status-card">
            <div className="api-status-row">
              <span>Connection</span>
              <span className="status-badge online">Connected</span>
            </div>
            <div className="api-status-row">
              <span>Version</span>
              <span>1.0.0</span>
            </div>
            <div className="api-status-row">
              <span>Topics</span>
              <span>
                {learnerState
                  ? Object.keys(learnerState.topic_mastery || {}).length
                  : 0}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div className="settings-section danger" variants={itemVariants}>
          <div className="section-title danger-title">
            <AlertTriangle size={16} /> Danger Zone
          </div>
          <div className="danger-item">
            <div>
              <span className="danger-label">Reset Progress</span>
              <span className="danger-desc">Clear all mastery data</span>
            </div>
            <motion.button
              className="danger-btn"
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div className="settings-footer" variants={itemVariants}>
        <motion.button
          className="save-btn"
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Save Settings
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
