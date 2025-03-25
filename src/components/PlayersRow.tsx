import { User } from "types";

type Props = {
  playersMap: Record<string, User>;
  userId: string;
  isRevealed: boolean;
};

// Random numbers for anon avatar
const anonNumber = Math.floor(Math.random() * 9) + 1;

const PlayersRow = ({ playersMap, userId, isRevealed }: Props) => {
  return Object.entries(playersMap).map(([key, player]) => (
    <li className={""} key={key}>
      {player.user_id === userId ? (
        <div className={"flex flex-col items-center"}>
          <img
            className={"rounded-full w-14 h-14 border"}
            src={`/avatars/Cute-portraits_${player.avatar}.png`}
            alt={player.game_name}
          />
          <span>{player.game_name}</span>
        </div>
      ) : (
        <div className={"flex flex-col items-center"}>
          <img
            className={"rounded-full w-14 h-14 border"}
            src={
              isRevealed
                ? `/avatars/Cute-portraits_${player.avatar}.png`
                : `/avatars/anons/anon${anonNumber}.png`
            }
          />

          {isRevealed ? player.game_name : "?"}
        </div>
      )}
    </li>
  ));
};

export default PlayersRow;
