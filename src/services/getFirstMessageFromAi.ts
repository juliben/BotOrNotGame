import supabase from "../api/supabase";
import axios from "axios";
import { AI_USER_ID } from "../../constants";
import flipCoin from "./flipCoin";
// Randomize whether AI sends first message
// I put it here so it's decided only from one place (instead of each player going thru this code)

const coinFlip = flipCoin();

export const getFirstMessageFromAi = async (AI_NAME: string) => {
  if (!coinFlip) {
    return;
  }
  try {
    console.log("Getting first message from AI");
    const response = await axios.get("http://localhost:3000/first-message");
    console.log("First message from AI:", response.data);
    const messageFromAi = response.data;

    // Send that message to Supabase

    const { error } = await supabase.from("messages").insert({
      sender_id: AI_USER_ID,
      content: messageFromAi,
      game_name: AI_NAME,
    });

    if (error) {
      console.log("Error sending first message from AI to Supabase:", error);
    }
  } catch {
    console.log("Error getting first message from AI");
  }
};
