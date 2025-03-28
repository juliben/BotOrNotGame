import { motion } from "motion/react";
import { QuitButton } from "./QuitButton";
import { XButton } from "./XButton";

interface Props {
  goBack: () => void;
  dismiss: () => void;
}

const OnlyLeftModal = ({ goBack, dismiss }: Props) => {
  return (
    <div className="fixed inset-0 flex-center font-press-start text-x bg-black/35">
      <div className="flex-center relative pt-4 bg-white/0">
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
          className={"absolute top-0 right-10"}
        >
          <XButton onClick={dismiss} />
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
          <div className={"flex-center w-1/2 sm:w-1/4 mx-auto"}>
            <QuitButton onClick={() => console.log("clicked")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnlyLeftModal;
