import { User } from "../../types";

type Props = {
  playersMap: Record<string, Partial<User>>;
};

const nameColors = {
  1: "text-[#8f80ef] px-1 font-medium",
  2: "text-[#72a4df] px-1 font-medium",
  3: "text-[#1dbdc2] px-1 font-medium",
  4: "text-[#9a319a] px-1 font-medium",
};

export const PlayerNames = ({ playersMap }: Props) => {
  return (
    <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
      {Object.values(playersMap).map((player, index) => (
        <span
          key={player.user_id}
          className={nameColors[(player.number as 1 | 2 | 3 | 4) ?? 1]}
        >
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
