import supabase from "../api/supabase";
import { AI_USER_ID } from "../../constants.ts";

// import { assignNumbersToPlayers } from "./assignNumbersToPlayers.ts";

export const addAIToRoom = async (roomId: string) => {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("players")
      .eq("id", roomId)
      .single();

    if (error) {
      console.log("Error fetching room data from Supabase:", error);
      return;
    }
    // Check if AI is already in the room
    if (data.players.includes(AI_USER_ID)) {
      console.log(`AI already in room ${roomId}`);
      return;
    }

    // Add AI to the room
    const { data: updateData, error: updateError } = await supabase
      .from("rooms")
      .update({ players: [...data.players, AI_USER_ID] })
      .eq("id", roomId)
      .select();

    if (updateError) {
      console.log("Error updating room data in Supabase:", updateError);
    }

    console.log("AI added to the room, player:", updateData[0].players);

    // Set room to full
    const { data: updateData2, error: updateError2 } = await supabase
      .from("rooms")
      .update({ status: "full" })
      .eq("id", roomId)
      .select();

    if (updateError2) {
      console.log("Error updating room data in Supabase:", updateError2);
    }

    console.log("Room set to full:", updateData2[0].status);
  } catch (error) {
    console.log("Error adding AI to the room:", error);
  }
};
