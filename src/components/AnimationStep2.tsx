import { motion } from "motion/react";
import { User } from "types";
import { XButton } from "./XButton";

interface Props {
  result: Partial<User>;
  userId: string;
  dismiss: () => void;
  setGameFinished: (finished: boolean) => void;
}

export const AnimationStep2 = ({
  result,
  userId,
  dismiss,
  setGameFinished,
}: Props) => {
  const handlePress = () => {
    setGameFinished(true);
    dismiss();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-center ">
      <div className="flex-center flex-col gap-4 rounded-xl   p-8 font-press-start">
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
            src={`/avatars/Cute-portraits_${result.avatar}.png`}
            alt="Winner's avatar"
            className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
          />
          <p className="text-xl">{result.game_name}</p>
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
            className="text-[var(--color-bright-pink)]"
          >
            {result.is_ai && "AI DETECTED"}
            {!result.is_ai && "NOT AN AI"}
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
          className="flex-center flex-col text-xl  text-center text-bright-pink"
        >
          <div className="flex flex-col">
            {result.user_id === userId && <p>YOU WIN!</p>}
            {result.is_ai && <p>HUMANS WIN!</p>}
            {!result.is_ai && result.user_id !== userId && <p>HUMANS LOSE!</p>}
          </div>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.75 }}
        >
          <XButton onClick={handlePress} />
        </motion.div>
      </div>
    </div>
  );
};
