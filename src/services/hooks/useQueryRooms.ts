import { useState, useEffect } from "react";
import supabase from "@/api/supabase";
import { queryRooms } from "../queryRooms";

export const useQueryRooms = (userId?: string) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) {
      return;
    }
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
  }, [userId]);

  return roomId;
};
