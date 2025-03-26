import { useState, useEffect, useRef } from "react";
import supabase from "../../api/supabase";
import { processVotes } from "../processVotes";

interface Props {
  roomId: string | undefined;
  setWinnerScreenVisible: (visible: boolean) => void;
}
export const useVoteChannel = ({ roomId, setWinnerScreenVisible }: Props) => {
  const [winner, setWinner] = useState(null);
  const [votes, setVotes] = useState([]);

  const winnerRef = useRef(null);
  const votersRef = useRef([]);

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
          if (payload.new.voted_for === null || payload.new.room_id != roomId) {
            return;
          }
          if (winnerRef.current) {
            return;
          }

          const vote = {
            vote: payload.new.voted_for,
          };
          const voter = payload.new.user_id;

          // Check if it is a duplicate vote

          if (votersRef.current === null) {
            votersRef.current = [];
          }
          if (votersRef.current.includes(voter)) {
            return;
          }

          votersRef.current = [...votersRef.current, voter];

          console.log("Received payload vote: " + vote.vote);
          setVotes((prevVotes) => {
            const updatedVotes = [...prevVotes, vote];
            if (updatedVotes.length >= 3) {
              clearInterval(votesTimerRef.current);
              const winner = processVotes(updatedVotes, roomId);
              winnerRef.current = winner;
              setWinner(winner);
              setWinnerScreenVisible(true);
            }
            return updatedVotes;
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from vote channel");
      channel.unsubscribe();
    };
  }, []);

  return winner;
};
