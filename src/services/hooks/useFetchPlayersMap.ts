import { useState, useEffect } from "react";
import { fetchPlayers } from "../fetchPlayers";

export const useFetchPlayersMap = (roomId?: string | null) => {
  const [playersMap, setPlayersMap] = useState({});
  const [playerCount, setPlayerCount] = useState(0);
  // Fetch players map
  useEffect(() => {
    if (!roomId) {
      return;
    }
    fetchPlayers({ roomId }).then((playersMap) => {
      if (playersMap) {
        setPlayersMap(playersMap);
        setPlayerCount(Object.keys(playersMap).length);
      }
    });
  }, [roomId]);

  return { playersMap, playerCount, setPlayersMap };
};
