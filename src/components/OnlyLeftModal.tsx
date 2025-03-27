import { motion } from "motion/react";
import { ExitButton } from "./ExitButton";

interface Props {
  onClick: () => void;
}

const OnlyLeftModal = ({ onClick }: Props) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center font-press-start text-x ">
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
          <ExitButton onClick={onClick} children={"Return to Lobby"} />
        </div>
      </motion.div>
    </div>
  );
};

export default OnlyLeftModal;
