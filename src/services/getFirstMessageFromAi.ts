import supabase from "../api/supabase";

import axios from "axios";
import { AI_USER_ID } from "../../constants";
import flipCoin from "./flipCoin";
// Randomize whether AI sends first message
const coinFlip = flipCoin();
// I put it here so it's decided only from one place (instead of each player going thru this code)

export const getFirstMessageFromAi = async (
  AI_NAME: string,
  avatar: string,
  roomId: string
) => {
  // if (!coinFlip) {
  //   return;
  // }
  try {
    console.log("Getting first message from AI");
    const response = await axios.get(
      "http://localhost:3000/first-message-spanish"
    );
    console.log("First message from AI:", response.data);

    /// Split the response into sentences to appear more human
    let initialSentences = response.data.response.split(/(?<=[.?!"])\s+/);

    let sentences = initialSentences.flatMap((sentence) => {
      // More casual spelling
      sentence = sentence
        .trim()
        .replace(/[¿¡]/g, "") // remove all ¿ and ¡ characters
        .replace(/[.!"]$/, ""); // then remove trailing punctuation if needed

      // 50% chance of 'haha' or 'jaja' sent in a different message
      if (flipCoin()) {
        return sentence
          .split(/(\b(?:haha|jaja)\b)(?=\s*$)/gi)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);
      } else {
        return [sentence];
      }
    });

    console.log("sentences:", sentences);

    // Process each sentence sequentially.
    for (const sentence of sentences) {
      // Calculate the delay for this sentence (e.g., 50ms per character)
      const sentenceDelay = sentence.length * 100;
      console.log(
        `Waiting ${sentenceDelay}ms before sending sentence: "${sentence}"`
      );

      // Wait for the delay.
      await delay(sentenceDelay);

      // Now insert the sentence.
      const { error } = await supabase.from("messages").insert({
        sender_id: AI_USER_ID,
        content: sentence,
        game_name: AI_NAME,
        avatar: avatar,
        room_id: roomId,
      });
      if (error) {
        console.log("Error sending sentence to Supabase:", error);
      }
    }
  } catch {
    console.log("Error getting first message from AI");
  }
};
