import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";
import { shuffle } from "lodash";

import { getUserId } from "@/services/getUserId.ts";
import { fetchParticipants } from "@/services/fetchParticipants.ts";
import { fetchParticipantNames } from "@/services/fetchParticipantNames.ts";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // Array of names with corresponding userIds ({ game_name, user_id })
  const [namesWithIds, setNamesWithIds] = useState([]);
  const [shuffledNames, setShuffledNames] = useState([]);
  const [userId, setUserId] = useState(null);
  const roomId = useParams().roomId;

  useEffect(() => {
    getUserId().then((id) => setUserId(id));
  }, []);

  // // Channel subscription
  // useEffect(() => {
  //   console.log("Subscribing to channel");
  //   const channel = supabase
  //     .channel("messages_changes")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "INSERT",
  //         schema: "public",
  //         table: "messages",
  //       },
  //       (payload) => {
  //         console.log("Received payload:" + payload.new);
  //         const newMessage = {
  //           sender: payload.new.sender_id,
  //           message: payload.new.content,
  //         };
  //         console.log("New message:" + newMessage);
  //         setMessages((messages) => [...messages, newMessage]);

  //         // Send messages to AI (with context)
  //         // Do this to send only 1 request to the AI (instead of 1 per player)
  //         if (namesWithIds[0].user_id === userId) {
  //           const sendMessageToAi = async () => {
  //             if (input === "") return;

  //             try {
  //               const response = await fetch("http://localhost:3000/", {
  //                 method: "POST",
  //                 headers: {
  //                   "Content-Type": "application/json",
  //                 },
  //                 body: JSON.stringify({ messages }),
  //               });

  //               const data = await response.json();

  //               return data.message;
  //             } catch (error) {
  //               console.error("Error fetching AI messages:", error);
  //             }
  //           };

  //           sendMessageToAi();
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     console.log("Unsubscribing from channel");
  //     channel.unsubscribe();
  //   };
  // }, []);

  useEffect(() => {
    fetchParticipants(roomId, userId);
  }, [userId]);

  const handleSendMessage = async () => {
    if (input === "") return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({ sender_id: userId, content: input });
      if (error) {
        console.log("Error sending message to Supabase:", error);
      }
      setInput("");
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  const names = namesWithIds.map((player) => player.game_name);

  // Correspond the shuffledNames indexes to the playerNameStyles
  useEffect(() => {
    setShuffledNames(shuffle(names));
  }, []);

  const playerNameStyles = {
    "0": "text-[var(--chat-1)]",
    "1": "text-[var(--chat-2)]",
    "2": "text-[var(--chat-3)]",
    "3": "text-[var(--chat-4)]",
  };

  const messageBubbleStyles = {
    "0": "self-end bg-[var(--chat-1)] text-foreground mr-2", // Right-aligned bubble for sender 1
    "1": "self-start bg-[var(--chat-2)] text-foreground ml-2", // Left-aligned bubble for sender 2
    "2": "self-start bg-[var(--chat-3)] text-foreground ml-2", // Left-aligned bubble for sender 3
    "3": "self-start bg-[var(--chat-4)] text-foreground ml-2", // Left-aligned bubble for sender 4
  };

  return (
    <div className={"flex flex-col p-4 min-h-screen max-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3"}>
        {shuffledNames.length > 0 && (
          <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
            {shuffledNames.map((name, index) => (
              <span key={name} className={`${playerNameStyles[index]} px-1`}>
                {name}
                {index < shuffledNames.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            have joined the room.
          </p>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xs p-2 rounded-lg  ${
              messageBubbleStyles[msg.sender]
            }`}
          >
            {msg.message}
          </div>
        ))}
      </Card>

      <div className={"flex gap-2 mt-auto"}>
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />{" "}
        <Button variant="secondary" onClick={() => console.log(userId)} />
        <Button variant="secondary" onClick={fetchParticipantNames}>
          Debug
        </Button>
        <Button onClick={handleSendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Room;
