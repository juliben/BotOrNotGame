import supabase from "../api/supabase";
import { addAIToRoom } from "./addAiToRoom";

export const fetchParticipants = async (roomId: string, userId: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .select("players")
    .eq("id", roomId)
    .single();

  if (error) {
    console.log("Error fetching participants from Supabase:", error);
    return;
  }

  if (data.players[0] === userId) {
    console.log("I am the first participant");
    await addAIToRoom(roomId);
  }
};
