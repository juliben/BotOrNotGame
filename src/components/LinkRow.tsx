import { motion } from "motion/react";
import { FaRegCopy } from "react-icons/fa6";

export const LinkRow = ({ roomId }: { roomId: string }) => {
  return (
    <div className={"flex flex-row flex-center gap-2 overflow-hidden"}>
      <div
        className={
          "flex  bg-gray-200 rounded-lg border inset-shadow pl-1 py-1 overflow-x-auto whitespace-nowrap max-w-[220px] sm:max-w-[250px] lg:max-w-[400px]"
        }
      >
        <p className={" text-black select-all "}>
          {`localhost:5173/invite/${roomId}?invite=true`}
        </p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(
            `localhost:5173/invite/${roomId}?invite=true`
          );
        }}
        className="rounded-md border bg-[#2c2971] shadow-xs px-2"
      >
        <motion.div
          whileHover={{
            scale: 1.1,
          }}
          whileTap={{
            scale: 0.9,
          }}
        >
          <div className="px-1 py-2">
            <FaRegCopy />
          </div>
        </motion.div>
      </button>
    </div>
  );
};
