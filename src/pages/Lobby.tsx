import { ReadyCountDisplay } from "../components/ReadyCountDisplay";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ping } from "@/services/ping";
import { queryRooms } from "@/services/queryRooms";
import supabase from "@/api/supabase";
import omit from "lodash/omit";
import isEqual from "lodash/isEqual";
import { assignNumbersToPlayers } from "@/services/assignNumbersToPlayers";
import { fetchPlayers } from "@/services";
import PlayersRow from "@/components/PlayersRow";

const TestScreen = ({}) => {
  const navigate = useNavigate();
  const userId = useParams().userId;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [readyToGo, setReadyToGo] = useState(false);
  const [playersMap, setPlayersMap] = useState({});
  const [playerCount, setPlayerCount] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const playersMapRef = useRef(playersMap);

  // Start pinging
  useEffect(() => {
    let pingInterval: any;
    console.log("Attempting to ping online status, userId:", userId);
    const startPinging = async () => {
      // Send initial ping
      ping(userId);

      console.log("Now pinging");

      // Send a ping every 30 seconds
      pingInterval = setInterval(() => ping(userId), 30000);
    };

    startPinging();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, []);

  // Query rooms & update room_id in 'players' table
  useEffect(() => {
    const initalRoomQuery = async () => {
      const roomId = await queryRooms(userId);

      // Update room_id of current player
      const { error } = await supabase
        .from("players")
        .update({ room_id: roomId })
        .eq("user_id", userId);
      if (error) {
        console.log("Error updating player:", error);
      }
      setRoomId(roomId);
    };

    initalRoomQuery();
  }, []);

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
      fetchPlayers({ roomId }).then((playersMap) => {
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
    <div className="flex flex-col flex-1 p-4 px-6 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <div className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50 top-0 left-0" />

      <button onClick={() => console.log(playersMap)}>Debug</button>
      <motion.div
        initial={{ translateX: 400, rotate: 10, opacity: 0.5 }}
        animate={{ translateX: 0, rotate: 0, opacity: 1 }}
        exit={{ translateX: -400, rotate: -10, opacity: 0.5 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col py-15 md:w-2/3 lg:w-1/2 flex-1 items-center justify-center h-2/3 w-full p-4 gap-7 border-2 rounded-xl bg-[#353b85] shadow-lg"
      >
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
      </motion.div>
    </div>
  );
};

export default TestScreen;
