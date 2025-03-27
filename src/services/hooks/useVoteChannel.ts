import { useState, useEffect, useRef } from "react";
import supabase from "../../api/supabase";

export const useVoteChannel = (roomId?: string) => {
  if (!roomId) {
    return;
  }
  // Array of user_ids of voted players
  const [votes, setVotes] = useState<string[]>([]);

  // Array of user_ids of players that have already voted (important to not count duplicate votes when receiving ping payloads)
  const votersRef = useRef<string[]>([]);

  // Vote channel subscription
  useEffect(() => {
    console.log("Subscribing to vote channel for roomId:", roomId);
    const channel = supabase
      .channel("vote_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // If the payload is not a vote, return (this will be receiving all pings so it's important)
          if (payload.new.voted_for === null || payload.new.room_id != roomId) {
            return;
          }

          const vote = payload.new.voted_for;
          const voter = payload.new.user_id;

          // Check if it is a duplicate vote (it will be duplicate each time a player that has already voted pings)
          if (votersRef.current === null) {
            votersRef.current = [];
          }
          if (votersRef.current.includes(voter)) {
            return;
          }

          votersRef.current = [...votersRef.current, voter];

          console.log("Received payload vote: " + vote);
          setVotes((prevVotes) => [...prevVotes, vote]);
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from vote channel");
      channel.unsubscribe();
    };
  }, []);

  return votes;
};
