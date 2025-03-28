import { User } from "types";

interface Props {
  winner: Partial<User> | "ALL_HUMANS_WIN";
  userId: string;
  playersMap: Record<string, Partial<User>>;
  setWinnerScreenVisible: (visible: boolean) => void;
}

const WinnerAnimation = ({ winner, userId, playersMap }: Props) => {
  return <div>WinnerAnimation</div>;
};

export default WinnerAnimation;
