import { motion } from "motion/react";
import { Button } from "./ui/button";
import { IoDice } from "react-icons/io5";

interface Props {
  onClick: () => void;
}

export function DiceButton({ onClick }: Props) {
  return (
    <Button
      onClick={onClick}
      className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground rounded-md border bg-[#2c2971] shadow-xs transition-[color,box-shadow]"
    >
      <motion.div
        whileHover={{
          scale: 1.1,
        }}
        whileTap={{
          scale: 0.9,
          rotate: 360,
        }}
      >
        <IoDice className={"text-white rotate-12 size-5"} />
      </motion.div>
    </Button>
  );
}
