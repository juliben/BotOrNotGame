import { useState } from "react";

interface Props {
  onClick: () => void;
}

export const XButton = ({ onClick }: Props) => {
  const handlePress = () => {
    setIsPressed(false);
    onClick();
  };

  const [isPressed, setIsPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      className={"flex justify-center items-center"}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={handlePress}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={handlePress}
      onTouchCancel={() => setIsPressed(false)} // mobile
    >
      {!isPressed && <img src="/ui/x.png" />}
      {isPressed && <img src="/ui/x_pressed.png" />}
    </button>
  );
};
