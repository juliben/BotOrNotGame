import supabase from "../api/supabase";

import axios from "axios";
import { AI_USER_ID } from "../../constants";
import flipCoin from "./flipCoin";

export const getFirstMessageFromAi = async (
  AI_NAME: string,
  avatar: string,
  roomId: string
) => {
  try {
    console.log("Getting first message from AI");
    const response = await axios.get(
      "http://localhost:3000/first-message-spanish"
    );
    console.log("Response from AI:", response.data);

    // / Split the response into sentences to appear more human
    let initialSentences = response.data.split(/(?<=[.?!"])\s+/);

    console.log("Initial sentences:", initialSentences);

    let sentences = initialSentences.flatMap((sentence) => {
      // More casual spelling
      sentence = sentence
        .trim()
        .replace(/[¿¡]/g, "") // remove all ¿ and ¡ characters
        .replace(/[.!"]$/, ""); // then remove trailing punctuation if needed

      // 50% chance of 'haha' or 'jaja' sent in a different message
      if (flipCoin()) {
        console.log("Sentence: ", sentence);
        return sentence
          .split(/(\b(?:haha|jaja)\b)(?=\s*$)/gi)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);
      } else {
        console.log("Sentence: ", sentence);
        return [sentence];
      }
    });

    // // Process each sentence sequentially.
    for (const sentence of sentences) {
      //   // Calculate the delay for this sentence (e.g., 50ms per character)
      const sentenceDelay = sentence.length * 50;
      console.log(
        `Waiting ${sentenceDelay}ms before sending sentence: "${sentence}"`
      );

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      // // Wait for the delay.
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
