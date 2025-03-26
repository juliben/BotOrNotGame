import { motion } from "motion/react";
export function Gradient({}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 0.5,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50 top-0 left-0"
    />
  );
}
