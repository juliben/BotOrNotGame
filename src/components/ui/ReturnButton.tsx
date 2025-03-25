import { motion } from "motion/react";

export function ReturnButton({}) {
  return (
    <motion.button
      initial={{
        opacity: 0,
        y: -110,
      }}
      animate={{
        opacity: 1,
        y: -110,
      }}
      transition={{
        delay: 4,
      }}
      className="
      text-[var(--text-accent)]
"
    >
      Return
    </motion.button>
  );
}
