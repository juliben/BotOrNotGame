import { motion } from "motion/react";
import { ReturnButton } from "./ui/ReturnButton";
import { User } from "types";

interface Props {
  winner: Partial<User> | "ALL_HUMANS_WIN";
  userId: string;
  setWinnerScreenVisible: (visible: boolean) => void;
  setAnimationStep2: (visible: boolean) => void;
}

export const AnimationStep2 = ({
  winner,
  userId,
  setWinnerScreenVisible,
}: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start">
        <motion.p
          initial={{
            y: 0,
          }}
          animate={{
            opacity: 0,
            y: -100,
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
            opacity: 1,
            y: 0,
          }}
          animate={{
            y: -130,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="flex items-center flex-col gap-4"
        >
          <motion.img
            src={`/avatars/Cute-portraits_${winner.avatar}.png`}
            alt="Winner's avatar"
            className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
          />
          <p className="text-xl">{winner.game_name}</p>
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: [0, 1, 0, 1, 0, 1],
            }}
            transition={{
              delay: 1.75,
              ease: "linear",
              times: [0, 0.1, 0.2, 0.3, 0.4, 1],
            }}
            className="text-red-400"
          >
            {winner.is_ai && "AI DETECTED"}
            {!winner.is_ai && "NOT AN AI"}
          </motion.p>
        </motion.div>
        <motion.h1
          initial={{
            opacity: 0,
            y: -120,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 2.75,
            duration: 0.25,
            ease: "easeOut",
          }}
          className="text-xl  text-center text-red-400"
        >
          {winner.user_id === userId && "YOU WIN!"}
          {winner.is_ai && "HUMANS WIN!"}
          {!winner.is_ai && "HUMANS LOSE!"}
        </motion.h1>
        <ReturnButton onClick={() => setWinnerScreenVisible(false)} />
      </div>
    </div>
  );
};
