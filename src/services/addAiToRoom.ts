import supabase from "../api/supabase";
import { AI_USER_ID } from "../../constants.ts";
import { generateNameForAi } from "./generateNameForAi";
import { fetchParticipantNames } from "./fetchParticipantNames";
import axios from "axios";
import { assignNumbersToPlayers } from "./assignNumbersToPlayers.ts";

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

    await generateNameForAi();

    await assignNumbersToPlayers(roomId);
    await fetchParticipantNames(roomId);

    // Randomize whether AI sends first message
    // I put it here so it's decided only from one place (instead of each player going thru this code)

    // const coinFlip = flipCoin();
    const coinFlip = true;
    console.log("Coin flip:", coinFlip);
    if (coinFlip) {
      const getFirstMessageFromAi = async () => {
        try {
          console.log("Getting first message from AI");
          const response = await axios.get(
            "http://localhost:3000/first-message"
          );
          console.log("First message from AI:", response.data);
          const messageFromAi = response.data;

          // Send that message to Supabase

          const { error } = await supabase
            .from("messages")
            .insert({ sender_id: AI_USER_ID, content: messageFromAi });

          if (error) {
            console.log(
              "Error sending first message from AI to Supabase:",
              error
            );
          }
        } catch {
          console.log("Error getting first message from AI");
        }
      };

      getFirstMessageFromAi();
    }
  } catch (error) {
    console.log("Error adding AI to the room:", error);
  }
};
