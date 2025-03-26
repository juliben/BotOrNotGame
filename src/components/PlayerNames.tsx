import { User } from "../../types.ts";

type Props = {
  playersMap: Record<string, Partial<User>>;
};

const nameColors = {
  1: "text-[#8f80ef] px-1 font-medium",
  2: "text-[#83b3ea] px-1 font-medium",
  3: "text-[#1dbdc2] px-1 font-medium",
  4: "text-[#be63be] px-1 font-medium",
};

export const PlayerNames = ({ playersMap }: Props) => {
  return (
    <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
      {Object.values(playersMap).map((player, index) => (
        <span key={player.user_id} className={nameColors[player.number]}>
          {player.game_name}
          {index === Object.keys(playersMap).length - 2 ? (
            <span className="text-foreground"> and</span>
          ) : (
            ""
          )}
          {index < Object.keys(playersMap).length - 2 ? "," : ""}
        </span>
      ))}{" "}
      have joined the room.
    </p>
  );
};
