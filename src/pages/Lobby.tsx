import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  useFetchPlayersMap,
  useQueryRooms,
  useStartPinging,
  useReadyPlayersChannel,
} from "@/services/hooks/";

import { Card, Gradient } from "./../components/ui/";
import { ReadyCountDisplay } from "./../components/ReadyCountDisplay";
import { PlayersRow } from "@/components/PlayersRow";
import { fetchPlayers, assignNumbersToPlayers } from "@/services";

const TestScreen = ({}) => {
  const navigate = useNavigate();
  const userId = useParams().userId;
  const [readyToGo, setReadyToGo] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useStartPinging(userId);
  const roomId = useQueryRooms(userId);
  const { playersMap, setPlayersMap } = useFetchPlayersMap(roomId);
  const playersMapRef = useRef(playersMap);

  const playerCount = useReadyPlayersChannel({
    roomId,
    setPlayersMap,
    playersMapRef,
  });

  useEffect(() => {
    if (!playersMap || !roomId || playerCount < 4) {
      return;
    }
    // Check if the room is full
    if (playerCount === 4) {
      console.log("Running assingNumbersToPlayers");
      try {
        assignNumbersToPlayers(roomId);
      } catch (error) {
        console.error("Error assigning numbers to players:", error);
      }
      setReadyToGo(true);
      // Assign color numbers to players
    }
  }, [playerCount]);

  useEffect(() => {
    if (readyToGo && roomId) {
      // Refetch players map
      fetchPlayers(roomId).then((playersMap) => {
        if (playersMap) {
          setPlayersMap(playersMap);
          playersMapRef.current = playersMap;
        }
      });
      setIsRevealed(true);

      const timeout = setTimeout(() => {
        console.log("Navigating, with playersMapRef:", playersMapRef.current);
        navigate(`/room/${roomId}`, {
          state: { playersMap: playersMapRef.current, userId: userId },
        });
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [readyToGo]);

  return (
    <div className="container">
      <Gradient />
      <Card>
        <p>Joined room: {roomId}</p>
        <div className={"flex flex-row"}>
          {!readyToGo && playersMap ? (
            <ReadyCountDisplay readyCount={Object.keys(playersMap).length} />
          ) : (
            playersMap && <p>Ready to start...</p>
          )}
        </div>
        <ul className={"flex flex-row gap-5 "}>
          {playersMap &&
            userId &&
            PlayersRow({ playersMap, userId, isRevealed })}
        </ul>
      </Card>
    </div>
  );
};

export default TestScreen;
