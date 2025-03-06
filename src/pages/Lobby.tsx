import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import { Icons } from "@/components/ui/spinner";

import { useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import { getUserId } from "../storage/localStorage";

const Lobby = () => {
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(true);
  const [count, setCount] = useState(5);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    const queryRooms = async () => {
      const userId = await getUserId();

      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("id, players, created_at")
        .eq("status", "waiting")
        .order("created_at", { ascending: true }) // join oldest room
        .limit(1);

      if (error) {
        console.log("Error querying rooms:", error);
        return;
      }

      let roomId;

      if (rooms.length > 0) {
        roomId = rooms[0].id;
        const updatedPlayers = [...rooms[0].players, userId];

        // Add player to 'players' column in 'rooms' table
        await supabase
          .from("rooms")
          .update({ players: updatedPlayers })
          .eq("id", roomId);

        console.log("Joined room:", roomId);
        setRoomId(roomId);

        // Change room full status to true if there are 3 players

        if (updatedPlayers.length === 3) {
          const { error: updateFullError } = await supabase
            .from("rooms")
            .update({ status: "full" })
            .eq("id", roomId);

          if (updateFullError) {
            console.log("Error updating room status:", updateFullError);
            return;
          }
        }

        /// Update 'room_id' in the players table for the current user, with the current room id
        const { error: playerRoomIdError } = await supabase
          .from("players")
          .update({ room_id: roomId })
          .eq("user_id", userId);

        if (playerRoomIdError) {
          console.log("Error updating player room ID:", playerRoomIdError);
          return;
        }

        if (!rooms) {
          console.log("Room not found:", roomId);
          return;
        }
      } else {
        const { data: newRoom, error } = await supabase
          .from("rooms")
          .insert({
            status: "waiting",
            players: [userId],
          })
          .select("id")
          .single();

        if (error) {
          console.log("Error creating room:", error);
          return;
        }
        roomId = newRoom.id;
        console.log("Created room:", roomId);
        setRoomId(roomId);

        const { error: playerRoomIdError } = await supabase
          .from("players")
          .update({ room_id: roomId })
          .eq("user_id", userId);

        if (playerRoomIdError) {
          console.log("Error updating player room ID:", playerRoomIdError);
          return;
        }

        if (!rooms) {
          console.log("Room not found:", roomId);
          return;
        }
      }
    };

    queryRooms();
  }, []);

  useEffect(() => {
    const fetchReadyPlayers = async () => {
      // Fetch the current count of ready players in the room
      const { count, error } = await supabase
        .from("players")
        .select("*", { count: "exact" })
        .eq("room_id", roomId)
        .eq("ready", true);

      if (!error) setReadyCount(count);
      console.log("Ready count:", count);
    };

    fetchReadyPlayers(); // Initial fetch

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${roomId}-ready`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log(
            "Ready status changed for user: ",
            payload.new.user_id,
            "to:",
            payload.new.ready
          );

          // Re-fetch the ready count
          const { count, error } = await supabase
            .from("players")
            .select("*", { count: "exact" })
            .eq("room_id", roomId)
            .eq("ready", true);

          if (!error) {
            setReadyCount(count);

            if (count === 3) {
              setWaiting(false);
            }
          }
        }
      )
      .subscribe();
    console.log("Subscribed to real-time updates for room:", roomId);

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleReady = async () => {
    const userId = await getUserId();

    const { error } = await supabase
      .from("players")
      .update([{ ready: !ready, game_name: name }])
      .eq("user_id", userId);
    if (error) {
      console.log("Error updating player:", error);
    }
    console.log("Set ready to:", !ready);
    setReady(!ready);
  };

  useEffect(() => {
    let countdownTimer;

    if (!waiting) {
      countdownTimer = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(countdownTimer);
            navigate("/room");
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownTimer);
  }, [waiting, navigate]);

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20">
      <p>Waiting for humans...{readyCount}/3</p>
      {waiting && <Icons.spinner className="h-4 w-4 animate-spin" />}
      {!waiting && <p>Starting in {count}...</p>}
      <p>Choose a name:</p>
      <Input
        type="text"
        className="w-2/3"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={() => getUserId()}>Generate name</Button>

      <div className="flex flex-row justify-center items-center gap-2">
        <Checkbox checked={ready} onCheckedChange={handleReady} />
        <Label>Ready</Label>
      </div>
    </div>
  );
};

export default Lobby;
