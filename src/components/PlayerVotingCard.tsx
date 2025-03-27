import { motion } from "motion/react";
import { User } from "types";
import { Button } from "./ui";

interface Props {
  handleVote: (votedId: string) => void;
  player: Partial<User>;
}

const bubble = {
  1: "bg-[#6a5acd]",
  2: "bg-[#5c8bc0]",
  3: "bg-[#009ba0]",
  4: "bg-[#660066]",
};

export const PlayerVotingCard = ({ handleVote, player }: Props) => {
  if (!player) {
    return null;
  }
  return (
    <motion.div
      key={player.user_id}
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
  );
};
