import { useEffect, useState } from "react";
import { User } from "types";

interface Props {
  playersMap: Record<string, Partial<User>>;
  playersMapRef: React.MutableRefObject<Record<string, Partial<User>>>;
}

export const useAllPlayersHaveNumbers = ({
  playersMap,
  playersMapRef,
}: Props) => {
  useEffect(() => {
    if (Object.values(playersMapRef.current).every((player) => player.number)) {
      return;
    }

    const updatedPlayers = Object.values(playersMap);

    updatedPlayers.forEach((player) => {
      if (player.user_id && player.number) {
        const userId = player.user_id;
        if (playersMapRef.current[userId]) {
          playersMapRef.current[userId].number = player.number;
          console.log(
            "Updated playersMapRef:",
            playersMapRef.current[userId].number
          );
        }
      }
    });
  }, [playersMap]);
};
