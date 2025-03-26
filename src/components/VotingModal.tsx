import { motion } from "motion/react";
import { Button } from "./ui/button";
import { User } from "types";

interface Props {
  userId: string;
  playersMap: Record<string, Partial<User>>;
  votingCountdown: number;
  handleVote: (votedId: string) => void;
}

const bubble = {
  1: "bg-[#6a5acd]",
  2: "bg-[#5c8bc0]",
  3: "bg-[#009ba0]",
  4: "bg-[#660066]",
};

export const VotingModal = ({
  userId,
  playersMap,
  votingCountdown,
  handleVote,
}: Props) => {
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
        <p className="text-center text-red-400 mb-3">{votingCountdown}</p>
        <h1 className="text-center font-bold mb-5 ">Who's the bot?</h1>
        <div className="flex flex-row flex-wrap item-center justify-center gap-0">
          {Object.values(playersMap).map((player) =>
            player.user_id === userId ? null : (
              <motion.div
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.9,
                }}
              >
                <Button
                  onClick={() => handleVote(player.user_id)}
                  className={`flex ${
                    bubble[player.number]
                  } items-center justify-center rounded-lg w-auto h-auto shadow-xl mx-2 mb-2  `}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <img
                      src={`/avatars/Cute-portraits_${player.avatar}.png`}
                      className="rounded-full h-14 w-14 ring shadow-xs"
                    />
                    <p className={`text-foreground`}>{player.game_name}</p>
                  </div>
                </Button>
              </motion.div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
