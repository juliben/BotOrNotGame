import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ping } from "@/services/ping";
import { queryRooms } from "@/services/queryRooms";
import supabase from "@/api/supabase";
import { fetchReadyPlayers } from "@/services/fetchReadyPlayers";
import omit from "lodash/omit";
import isEqual from "lodash/isEqual";
import { assignNumbersToPlayers } from "@/services/assignNumbersToPlayers";

const TestScreen = ({}) => {
  const navigate = useNavigate();
  const userId = useParams().userId;
  const [roomId, setRoomId] = useState(null);
  const [readyCount, setReadyCount] = useState(3);
  const [roomFull, setRoomFull] = useState(false);
  const [playersMap, setPlayersMap] = useState([{}]);
  const [isRevealed, setIsRevealed] = useState(false);

  // To reveal the player's avatars when starting the game
  useEffect(() => {
    if (roomFull) {
      setIsRevealed(true);
    }
  }, [roomFull]);

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

  useEffect(() => {
    fetchPlayers();
  }, [roomId]);

  // This updates the playersMap and the ready count state
  const fetchPlayers = async () => {
    fetchReadyPlayers(roomId).then(({ data, count }) => {
      if (count) {
        setReadyCount(count);
      }

      if (!data) {
        return;
      }

      const players = data.reduce((acc, player) => {
        acc[player.user_id] = player;
        return acc;
      }, {});

      setPlayersMap(players);
    });
  };

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
          fetchPlayers();
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
    if (readyCount < 4) {
      return;
    }
    // Check if the room is full
    if (readyCount === 4) {
      setRoomFull(true);

      // Assign color numbers to players
      console.log("Running assingNumbersToPlayers");
      try {
        assignNumbersToPlayers(roomId);
      } catch (error) {
        console.error("Error assigning numbers to players:", error);
      }

      setTimeout(() => {
        navigate(`/room/${roomId}`, { state: { playersMap } });
      }, 1500);
    }
  }, [readyCount]);

  return (
    <div className="flex flex-col flex-1 p-4 px-6 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <div className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50 top-0 left-0" />

      <motion.div
        initial={{ translateX: 400, rotate: 10, opacity: 0.5 }}
        animate={{ translateX: 0, rotate: 0, opacity: 1 }}
        exit={{ translateX: -400, rotate: -10, opacity: 0.5 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col py-15 md:w-2/3 lg:w-1/2 flex-1 items-center justify-center h-2/3 w-full p-4 gap-7 border-2 rounded-xl bg-[#353b85] shadow-lg"
      >
        <p>Joined room: {roomId}</p>
        <div className={"flex flex-row"}>
          {!roomFull ? (
            <div>
              Waiting for players to join...{" "}
              <motion.div
                className={"inline text-[var(--text-accent)] text-3xl"}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 1, -1, 0],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                {readyCount}
              </motion.div>
              /4
            </div>
          ) : (
            <p>Ready to start...</p>
          )}
        </div>
        <ul className={"flex flex-row gap-5 "}>
          {playersMap &&
            Object.entries(playersMap).map(([key, player]) => (
              <li className={""} key={key}>
                {player.user_id === userId ? (
                  <div className={"flex flex-col items-center"}>
                    <img
                      className={"rounded-full w-14 h-14 border"}
                      src={`/avatars/Cute-portraits_${player.avatar}.png`}
                      alt={player.game_name}
                    />
                    <span>{player.game_name}</span>
                  </div>
                ) : (
                  <div className={"flex flex-col items-center"}>
                    <img
                      className={"rounded-full w-14 h-14 border"}
                      src={
                        isRevealed
                          ? `/avatars/Cute-portraits_${player.avatar}.png`
                          : `/avatars/Cute-portraits_00.png`
                      }
                    />
                    <span className={isRevealed ? "" : "text-[var(--border)]"}>
                      {isRevealed ? player.game_name : "?"}
                    </span>
                  </div>
                )}
              </li>
            ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default TestScreen;
