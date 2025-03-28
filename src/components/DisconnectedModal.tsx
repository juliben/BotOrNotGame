import { motion } from "motion/react";
import { QuitButton } from "./QuitButton";

import { useNavigate } from "react-router-dom";

export const DisconnectedModal = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 flex-center font-press-start text-x bg-black/35">
      <div className="flex-center relative pt-4 bg-white/0">
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
          <h1 className="text-center font-bold mb-5 ">You have disconnected</h1>
          <div className={"flex-center w-1/2 sm:w-1/4 mx-auto"}>
            <QuitButton onClick={() => navigate("/")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
