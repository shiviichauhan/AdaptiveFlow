import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import './Notification.css'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

export default function Notification({ message, type, onClose }) {
  const Icon = iconMap[type] || Info

  return (
    <motion.div
      className={`notification ${type}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Icon size={16} className="notif-icon" />
      <span>{message}</span>
      <button className="notif-close" onClick={onClose}><X size={14} /></button>
    </motion.div>
  )
}