import { motion } from "motion/react";

type Props = {
  readyCount: number;
};

export const ReadyCountDisplay = ({ readyCount }: Props) => {
  return (
    <div>
      Waiting for players to join...{" "}
      <motion.div
        className={"inline-block text-[var(--text-accent)] text-3xl"}
        animate={{
          rotate: [0, 1.2, -1.2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {readyCount}
      </motion.div>
      /4
    </div>
  );
};
