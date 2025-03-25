import { User } from "../../types.ts";

type Props = {
  playersMap: Record<string, User>;
};

const PlayerNames = ({ playersMap }: Props) => {
  return (
    <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
      {Object.values(playersMap).map((player, index) => (
        <span
          key={player.user_id}
          className={`${playerNameStyles[player.number]} px-1 font-medium `}
        >
          {player.game_name}
          {index < Object.keys(playersMap).length - 1 ? ", " : ""}
        </span>
      ))}{" "}
      have joined the room.
    </p>
  );
};

export default PlayerNames;
