import { User } from "../../types.ts";

type Props = {
  playersMap: Record<string, Partial<User>>;
};

const PlayerNames = ({ playersMap }: Props) => {
  return (
    <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
      {Object.values(playersMap).map((player, index) => (
        <span
          key={player.user_id}
          className={`text-[var(--player-${player.number}-row)] px-1 font-medium`}
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

export default PlayerNames;
