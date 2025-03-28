import { useState, useEffect, useRef } from "react";
import { PlayerVotingCard } from "./PlayerVotingCard";
import { motion } from "motion/react";
import { User } from "types";

interface Props {
  userId: string;
  playersMap: Record<string, Partial<User>>;
  handleVote: (votedId: string) => void;
  aiUserId: string;
}

export const VotingModal = ({
  playersMap,
  userId,
  aiUserId,
  handleVote,
}: Props) => {
  const [countdown, setCountdown] = useState(4);
  const [selection, setSelection] = useState<string | null>(null);
  const randomIdRef = useRef<string | null>(null);

  // It doesn't matter if someone disconnects during voting time - the randomId to vote for is defined here at first render
  // (Anyway it wouldn't matter because offline time to trigger disconnection is longer than voting time, but just in case)
  if (randomIdRef.current === null) {
    const voteOptions = Object.keys(playersMap).filter(
      (player) => player !== userId && player !== aiUserId
    );
    randomIdRef.current =
      voteOptions[Math.floor(Math.random() * voteOptions.length)];
  }

  useEffect(() => {
    const counter = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(counter);
          setSelection(randomIdRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(counter);
  }, []);

  useEffect(() => {
    if (selection) {
      console.log("Voting for:", selection);
      handleVote(selection);
    }
  }, [selection]);

  return (
    <div className="fixed inset-0 flex-center font-press-start text-x ">
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
        <p className="text-center text-red-400 mb-3">{countdown}</p>
        <h1 className="text-center font-bold mb-5 ">Who's the bot?</h1>
        <div className="flex-center flex-row flex-wrap gap-0">
          {Object.values(playersMap).map((player) =>
            player.user_id === userId ? null : (
              <PlayerVotingCard
                key={player.user_id}
                setSelection={setSelection}
                player={player}
              />
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
