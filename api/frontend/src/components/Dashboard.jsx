import { motion } from "framer-motion";
import StatsGrid from "./StatsGrid";
import Recommendations from "./Recommendations";
import KnowledgeGraph from "./KnowledgeGraph";
import WeakAreas from "./WeakAreas";
import PerformanceCharts from "./PerformanceCharts";
import "./Dashboard.css";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function Dashboard({
  onOpenItem,
  showNotification,
  learnerId,
  learnerState,
  topics,
}) {
  return (
    <motion.div
      className="dashboard-view"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <motion.div className="greeting" variants={fadeUp}>
        <h1>Welcome back, Student</h1>
        <p className="subtitle">You're making great progress. Keep it up!</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <StatsGrid learnerId={learnerId} learnerState={learnerState} />
      </motion.div>

      <section className="content-grid">
        <motion.div variants={fadeUp}>
          <Recommendations
            onOpenItem={onOpenItem}
            showNotification={showNotification}
            learnerId={learnerId}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KnowledgeGraph learnerId={learnerId} />
        </motion.div>
      </section>

      <motion.div variants={fadeUp}>
        <WeakAreas
          onOpenItem={onOpenItem}
          showNotification={showNotification}
          learnerId={learnerId}
          learnerState={learnerState}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <PerformanceCharts learnerId={learnerId} />
      </motion.div>
    </motion.div>
  );
}
