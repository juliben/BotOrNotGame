import supabase from "@/api/supabase";
import { v4 as uuidv4 } from "uuid";
import addAiToRoom from "./addAiToRoom";

export const createPrivateRoom = async (userId: string | undefined) => {
  if (!userId) {
    return;
  }

  const newRoomId = uuidv4();

  const { error } = await supabase.from("rooms").insert([
    {
      room_id: newRoomId,
      is_private: true,
      status: "waiting",
      players: [userId],
    },
  ]);
  if (error) {
    console.log("Error creating private room:", error);
  }

  console.log("Created private room:", newRoomId);
  await addAiToRoom(newRoomId);
  return newRoomId;
};
