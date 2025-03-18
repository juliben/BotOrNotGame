import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ping } from "@/services/ping";
import { queryRooms } from "@/services/queryRooms";
import supabase from "@/api/supabase";
import { fetchReadyPlayers } from "@/services/fetchReadyPlayers";

const TestScreen = ({}) => {
  const userId = useParams().userId;
  const [roomId, setRoomId] = useState(null);
  const [readyCount, setReadyCount] = useState(1);

  // My game_name and avatar
  const [myData, setMyData] = useState(null);

  //   // Start pinging
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

  // Query rooms
  useEffect(() => {
    const initalRoomQuery = async () => {
      const roomId = await queryRooms(userId);
      setRoomId(roomId);
    };

    initalRoomQuery();
  }, []);

  // Subscribe to channel (ready players)
  useEffect(() => {
    if (!roomId) {
      return;
    }

    fetchReadyPlayers(roomId).then((count) => {
      console.log("Fetching ready players:", count);
      setReadyCount(count);
    });

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
          // console.log("Payload", payload);

          // Re-fetch the ready count
          const { count, error } = await supabase
            .from("players")
            .select("*", { count: "exact" })
            .eq("room_id", roomId)
            .eq("is_ready", true)
            .eq("is_online", true);

          if (!error) {
            setReadyCount(count);

            // if (count === 3) {
            //   setWaiting(false);
            // }
          }
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
    const fetchMyData = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("game_name, avatar")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.log("Error fetching my data from Supabase:", error);
        return;
      }

      return data;
    };
    fetchMyData().then((data) => {
      if (data) {
        setMyData(data);
      }
    });
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("players")
      .eq("id", roomId)
      .single();

    if (error) {
      console.log("Error fetching players from Supabase:", error);
      return;
    }

    return data.players;
  };

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
        <div className={"flex flex-row"}>
          <p>
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
            /3
          </p>
        </div>
        {myData && (
          <div className="flex flex-row gap-4">
            <div className="flex flex-col items-center">
              <img
                src={`../../public/avatars/Cute-portraits_${myData.avatar}.png`}
                className="w-14 h-14 rounded-full"
              />
              <p>{myData.game_name}</p>
            </div>
            {readyCount === 2 && (
              <div className="flex flex-col items-center">
                <img
                  src={`../../public/avatars/Cute-portraits_01.png`}
                  className="w-14 h-14 rounded-full"
                />
                <p>?</p>
              </div>
            )}
            {readyCount === 3 && (
              <>
                <div className="flex flex-col items-center">
                  <img
                    src={`../../public/avatars/Cute-portraits_00.png`}
                    className="w-14 h-14 rounded-full border shadow-xs"
                  />
                  <p className="text-[var(--border)]">?</p>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={`../../public/avatars/Cute-portraits_00.png`}
                    className="w-14 h-14 rounded-full borde shadow-xs"
                  />
                  <p className="text-[var(--border)]">?</p>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TestScreen;
