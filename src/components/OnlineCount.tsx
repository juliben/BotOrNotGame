import { motion } from "motion/react";

interface Props {
  onlinePlayers: number;
}
export function OnlineCount({ onlinePlayers }: Props) {
  return (
    <>
      {" "}
      <motion.div // Pulsating effect
        initial={{
          scale: 1,
          opacity: 1,
        }}
        animate={{
          scale: [1, 1.01, 1],
          opacity: [1, 0.95, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute top-5 left-5 text-[var(--text-accent)]"
      >
        <motion.div // Glitchy effect
          animate={{}}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.6, 0.61, 0.7, 0.71, 0.8],
          }}
        >
          Online: {onlinePlayers}
        </motion.div>
      </motion.div>
      <motion.div // Pulsating animation
        animate={{
          scale: [1, 1.01, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute top-5 left-5  blur-sm  "
      >
        <motion.div // Glitchy animation
          initial={{
            color: "#39d4b7",
          }}
          animate={{
            color: [
              "#39d4b7",
              "#808080",
              "#39d4b7",
              "#808080",
              "#39d4b7",
              "#808080",
              "#39d4b7",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.6, 0.61, 0.7, 0.71, 0.8, 0.85],
            ease: "linear",
          }}
        >
          Online: {onlinePlayers}
        </motion.div>
      </motion.div>
    </>
  );
}
