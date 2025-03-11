import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";
import { shuffle } from "lodash";
import { IoMdBug } from "react-icons/io";

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

  // For color purposes
  const playersMapRef = useRef([]);

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the messages container
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    getUserId().then((id) => setUserId(id));
  }, []);

  // Channel subscription
  useEffect(() => {
    console.log("Subscribing to channel");
    const channel = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = {
            sender: payload.new.sender_id,
            message: payload.new.content,
          };
          console.log("Received payload message: " + newMessage.message);
          setMessages((messages) => [...messages, newMessage]);

          // Send messages to AI (with context)
          // Do this to send only 1 request to the AI (instead of 1 per player)
          if (namesWithIds[0].user_id === userId) {
            const sendMessageToAi = async () => {
              if (input === "") return;

              try {
                const response = await fetch("http://localhost:3000/", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ messages }),
                });

                const data = await response.json();

                return data.message;
              } catch (error) {
                console.error("Error fetching AI messages:", error);
              }
            };

            sendMessageToAi();
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchParticipants(roomId, userId);
  }, []);

  const handleSendMessage = async () => {
    if (input === "") return;
    if (!userId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        content: input,
        // number: playersMapRef.current[userId],
      });
      if (error) {
        console.log("Error sending message to Supabase:", error);
      }
      setInput("");
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  useEffect(() => {
    const fetchPlayerNamesAndIds = async () => {
      const players = await fetchParticipantNames(roomId);
      console.log("Players with name, id and number:", players);
      setNamesWithIds(players);

      if (!players) return;

      playersMapRef.current = players.reduce((acc, player) => {
        acc[player.user_id] = player.number;
        return acc;
      }, {});
      console.log("Players map:", playersMapRef.current);
    };
    fetchPlayerNamesAndIds();
  }, []);

  // Correspond the shuffledNames indexes to the playerNameStyles
  useEffect(() => {
    setShuffledNames(namesWithIds);
  }, []);

  const playerNameStyles = {
    1: "text-[var(--chat-1)]",
    2: "text-[var(--chat-2)]",
    3: "text-[var(--chat-3)]",
    4: "text-[var(--chat-4)]",
  };

  const messageBubbleStyles = {
    1: "bg-[var(--chat-1)] text-foreground mx-2", // Right-aligned bubble for sender 1
    2: "bg-[var(--chat-2)] text-foreground mx-2", // Left-aligned bubble for sender 2
    3: "bg-[var(--chat-3)] text-foreground mx-2", // Left-aligned bubble for sender 3
    4: "bg-[var(--chat-4)] text-foreground mx-2", // Left-aligned bubble for sender 4
  };

  return (
    <div className={"flex flex-col p-4 min-h-screen max-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3 py-3 gap-3"}>
        {playersMapRef.current && (
          <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
            {shuffledNames.map((player, index) => (
              <span
                key={player.user_id}
                className={`${playerNameStyles[player.number]} px-1`}
              >
                {player.game_name}
                {index < shuffledNames.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            have joined the room.
          </p>
        )}
        {messages.map((msg, index) => {
          const senderNumber = playersMapRef.current[msg.sender];

          return (
            <>
              <div
                key={index}
                className={`max-w-xs p-2 rounded-lg ${
                  msg.sender === userId ? "self-end" : "self-start"
                } message-bubble ${messageBubbleStyles[senderNumber]}`}
              >
                {msg.message}
                <div ref={messagesEndRef} />
              </div>
            </>
          );
        })}
      </Card>

      <div className={"flex gap-2 mt-auto"}>
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />{" "}
        <Button
          variant="secondary"
          onClick={() => console.log(playersMapRef.current)}
        >
          <IoMdBug />
        </Button>
        <Button onClick={handleSendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Room;
