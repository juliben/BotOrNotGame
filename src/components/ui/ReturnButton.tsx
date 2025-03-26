import { motion } from "motion/react";

interface Props {
  onClick: () => void;
}

export const ReturnButton = ({ onClick }: Props) => {
  return (
    <motion.button
      onClick={onClick}
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
};
