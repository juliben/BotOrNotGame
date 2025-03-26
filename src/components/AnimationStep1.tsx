import { motion } from "motion/react";
import { User } from "types";

interface Props {
  winner: Partial<User>;
  setWinnerScreenVisible: (visible: boolean) => void;
  setAnimationStep2: (visible: boolean) => void;
}

export const AnimationStep1 = ({
  winner,
  setWinnerScreenVisible,
  setAnimationStep2,
}: Props) => {
  return (
    <motion.button
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.25,
      }}
      onClick={() => {
        setWinnerScreenVisible(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 "
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start ">
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            y: -50,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        >
          The chat voted for...
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: [1],
            y: -50,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: 0.75,
          }}
          className="flex items-center flex-col gap-4"
        >
          <motion.img
            animate={{
              rotateY: [0, 1080],
            }}
            transition={{
              delay: 0.75,
              duration: 1.5,
              ease: "easeOut",
            }}
            onAnimationComplete={() => {
              setAnimationStep2(true);
            }}
            src={`/avatars/Cute-portraits_${winner.avatar}.png`}
            alt="Winner's avatar"
            className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
          />
        </motion.div>
      </div>
    </motion.button>
  );
};
