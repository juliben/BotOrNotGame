import { RefObject } from "react";
import supabase from "../api/supabase";
import { flipCoin } from "./flipCoin";
import { Message } from "types";

// Utility function to return a promise that resolves after a given delay.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Send request to API, then process the response, and insert into Supabase

export const sendMessagesToAi = async (
  roomId: string | undefined,
  messages: Partial<Message>[],
  aiUser: any,
  requestInProgress: RefObject<boolean>
) => {
  try {
    console.log("Sending messages to AI");

    const response = await fetch(
      "https://silkyxpphpftgloncpls.functions.supabase.co/getAiMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Required to indicate the body is JSON
        },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      requestInProgress.current = false;
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    let parsedJson;
    if (typeof data.response === "string") {
      try {
        parsedJson = JSON.parse(data.response);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      parsedJson = data.response;
    }

    const message = parsedJson.response;
    const isAppropriate =
      parsedJson.shouldRespond === true && parsedJson.confidence >= 0.7;

    if (!isAppropriate) {
      console.log("AI response is not appropriate, skipping...");
      requestInProgress.current = false;
      return;
    }
    const initialSentences = message.split(/(?<=[.?!"])\s+/);

    let sentences = initialSentences.flatMap((sentence: string) => {
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

    // Process each sentence sequentially.
    for (const sentence of sentences) {
      // Calculate the delay for this sentence (e.g., 50ms per character)
      const sentenceDelay = sentence.length * 50;
      console.log(
        `Waiting ${sentenceDelay}ms before sending sentence: "${sentence}"`
      );

      // Wait for the delay.
      await delay(sentenceDelay);

      // Now insert the sentence.
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_id: aiUser.user_id,
        content: sentence,
        game_name: aiUser.game_name,
        avatar: aiUser.avatar,
        is_from_ai: true,
      });
      if (error) {
        console.log("Error sending sentence to Supabase:", error);
      }
    }
  } catch (error: any) {
    if (error.status === 429) {
      console.log("Another AI request in progress.");
    }
    console.log("Error sending message to AI:", error);
  } finally {
    requestInProgress.current = false;
  }
};
