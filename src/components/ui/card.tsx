import { motion } from "motion/react";

export const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ translateX: 400, rotate: 10, opacity: 0.5 }}
      animate={{ translateX: 0, rotate: 0, opacity: 1 }}
      exit={{ translateX: -400, rotate: -10, opacity: 0.5 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      {children}
    </motion.div>
  );
};
