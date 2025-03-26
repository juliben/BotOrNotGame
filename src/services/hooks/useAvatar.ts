import { useState, useEffect } from "react";
import { avatarRandomizer } from "../avatarRandomizer";

export const useAvatar = () => {
  const [randomAvatarNumber, setRandomAvatarNumber] = useState<string | null>(
    null
  );

  const roll = () => {
    setRandomAvatarNumber(avatarRandomizer());
  };

  useEffect(() => {
    roll();
  }, []);

  const avatarUrl = `/avatars/Cute-portraits_${randomAvatarNumber}.png`;
  return { randomAvatarNumber, avatarUrl, roll };
};
