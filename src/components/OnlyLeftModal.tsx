import { motion } from "motion/react";
import { ExitButton } from "./ExitButton";

interface Props {
  goBack: () => void;
  dismiss: () => void;
}

const OnlyLeftModal = ({ goBack, dismiss }: Props) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center font-press-start text-x bg-black/35">
      <motion.button
        initial={{
          scale: 0.5,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        onClick={dismiss}
        className={"absolute right-10 top-50"}
      >
        X
      </motion.button>
      <motion.div
        initial={{
          scale: 0.5,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="p-4 m-4 w-full mb-20"
      >
        <h1 className="text-center font-bold mb-5 ">
          You and the AI are the only players left
        </h1>
        <div className={"w-1/2 sm:w-1/4 mx-auto hover:cursor-pointer"}>
          <ExitButton onClick={goBack} children={"Return to Lobby"} />
        </div>
      </motion.div>
    </div>
  );
};

export default OnlyLeftModal;
