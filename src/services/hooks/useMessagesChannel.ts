import { useEffect, useState } from "react";
import supabase from "../../api/supabase";
import { Message } from "types";

export const useMessagesChannel = (roomId: string | undefined) => {
  if (!roomId) {
    return;
  }
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  // Messages channel subscription
  useEffect(() => {
    console.log("Subscribing to messages channel, roomId: " + roomId);
    const channel = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Non-strict comparison (otherwise it doesn't work)
          if (payload.new.room_id != roomId) {
            return;
          }

          const newMessage: Partial<Message> = {
            sender_id: payload.new.sender_id,
            game_name: payload.new.game_name,
            content: payload.new.content,
            is_vote: payload.new.is_vote,
            is_from_ai: payload.new.is_from_ai,
            is_from_server: payload.new.is_from_server,
            avatar: payload.new.avatar,
          };
          console.log("Received payload message: " + newMessage.content);
          setMessages((messages) => [...messages, newMessage]);
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, [roomId]);

  return messages;
};
