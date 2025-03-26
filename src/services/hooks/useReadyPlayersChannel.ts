import supabase from "@/api/supabase";
import { isEqual, omit } from "lodash";
import { useState, useEffect } from "react";
import { fetchPlayers } from "../fetchPlayers";

interface Props {
  roomId?: string | null;
  setPlayersMap: (playersMap: {}) => void;
  playersMapRef: any;
}

export const useReadyPlayersChannel = ({
  roomId,
  setPlayersMap,
  playersMapRef,
}: Props) => {
  const [playerCount, setPlayerCount] = useState(0);
  // Subscribe to channel (ready players)
  useEffect(() => {
    if (!roomId) {
      return;
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${roomId}-is_ready`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // To check if the payload is just because of pings
          if (payload.eventType === "UPDATE" && payload.old && payload.new) {
            const oldData = omit(payload.old, "last_seen");
            const newData = omit(payload.new, "last_seen");

            if (isEqual(oldData, newData)) {
              return;
            }
          }

          console.log("Running this from the payload");
          // There's been a legit change -> Refetch
          fetchPlayers({ roomId }).then((playersMap) => {
            if (playersMap) {
              console.log("Players map updated:", playersMap);
              setPlayersMap(playersMap);
              playersMapRef.current = playersMap;
              setPlayerCount(Object.keys(playersMap).length);
            }
          });
        }
      )

      .subscribe();

    console.log(
      "Subscribed to real-time updates (ready players) for room:",
      roomId
    );

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return playerCount;
};
