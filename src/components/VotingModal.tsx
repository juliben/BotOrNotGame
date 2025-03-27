import { PlayerVotingCard } from "./PlayerVotingCard";
import { motion } from "motion/react";
import { User } from "types";

interface Props {
  userId: string;
  playersMap: Record<string, Partial<User>>;
  votingCountdown: number;
  handleVote: (votedId: string) => void;
}

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
              <PlayerVotingCard handleVote={handleVote} player={player} />
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
