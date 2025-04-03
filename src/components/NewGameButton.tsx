import { useState } from "react";

interface Props {
  onClick: () => void;
}

export const NewGameButton = ({ onClick }: Props) => {
  const handlePress = () => {
    setIsPressed(false);
    onClick();
  };
  const [isPressed, setIsPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      className={"flex justify-center items-center hover:cursor-pointer"}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={handlePress}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={handlePress}
      onTouchCancel={() => setIsPressed(false)} // mobile
      onMouseEnter={() => setIsPressed(true)}
    >
      {!isPressed && <img src="/ui/newgame.png" />}
      {isPressed && <img src="/ui/newgame_pressed.png" />}
    </button>
  );
};
