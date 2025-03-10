import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";
import { shuffle } from "lodash";
import flipCoin from "../services/flipCoin.ts";

const senderStyles = {
  "1": "self-end bg-[var(--chat-1)] text-foreground mr-2", // Right-aligned bubble for sender 1
  "2": "self-start bg-[var(--chat-2)] text-foreground ml-2", // Left-aligned bubble for sender 2
  "3": "self-start bg-[var(--chat-3)] text-foreground ml-2", // Left-aligned bubble for sender 3
  "4": "self-start bg-[var(--chat-4)] text-foreground ml-2", // Left-aligned bubble for sender 4
};

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playersNames, setPlayersNames] = useState([]);
  const roomId = useParams().roomId;
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("players")
        .eq("id", roomId)
        .single();

      if (error) {
        console.log("Error fetching participants from Supabase:", error);
        return;
      }

      const participants = data.players;

      if (participants[0] === userId) {
        console.log("I am the first participant");
        addAIToRoom();
      }
    };
    fetchParticipants();
  }, [userId]);

  const addAIToRoom = async () => {
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

      console.log("updateData:", updateData);
      console.log("AI added to the room");
      generateNameForAi();

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
            console.log("First message from AI:", response.data.message);
            const messageFromAi = response.data.message;

            // Send that message to Supabase

            const { error } = await supabase
              .from("messages")
              .insert({ sender: AI_USER_ID, message: messageFromAi });

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

  useEffect(() => {
    const fetchParticipantNames = async () => {
      try {
        const { data, error } = await supabase
          .from("players")
          .select("user_id, game_name")
          .eq("room_id", roomId);
        if (error) {
          console.log("Error fetching participants from Supabase:", error);
          return;
        }

        const humanPlayersNames = data.map((player) => player.game_name);

        // Fetch AI name
        const { data: aiName, error: aiNameError } = await supabase
          .from("players")
          .select("game_name")
          .eq("user_id", AI_USER_ID)
          .single();

        if (aiNameError) {
          console.log("Error fetching AI name:", aiNameError);
          return;
        }
        const aiNamePart = getFirstName(aiName.game_name);
        const allPlayersNames = [...humanPlayersNames, aiNamePart];
        const shuffledPlayers = shuffle(allPlayersNames);
        setPlayersNames(shuffledPlayers);
      } catch (error) {
        console.log("Error fetching participants names:", error);
      }
    };
    fetchParticipantNames();
  }, [roomId]);

  const generateNameForAi = async () => {
    try {
      const response = await axios.get("http://localhost:3000/name");
      console.log("Name for AI:", response.data.name);
      const generatedName = response.data.name;

      const firstName = getFirstName(generatedName);

      // Update AI's name in Supabase

      const { error } = await supabase
        .from("players")
        .update({ game_name: firstName })
        .eq("user_id", AI_USER_ID);

      if (error) {
        console.log("Error updating AI's name in Supabase:", error);
      }
    } catch {
      console.log("Error generating name");
    }
  };
  const getFirstName = (input: string) => {
    const prefixes = [
      "Male Human Name:",
      "Female Human Name:",
      "Male Dwarf Name:",
      "Female Dwarf Name:",
      "Male Elf Name:",
      "Female Elf Name:",
      "Male Hobbit Name:",
      "Female Hobbit Name:",
      "Male Orc Name:",
      "Female Orc Name:",
      "Male Gnome Name:",
      "Female Gnome Name:",
    ];
    let namePart = input;

    prefixes.forEach((prefix) => {
      if (namePart.startsWith(prefix)) {
        namePart = namePart.replace(prefix, "").trim();
      }
    });
    return namePart.split(" ")[0];
  };

  const sendMessageToAi = async () => {
    if (input === "") return;
    const message = input;

    try {
      const response = await fetch("http://localhost:3000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      return data.message;
    } catch (error) {
      console.error("Error fetching AI messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (input === "") return;
    setLoading(true);
    const updatedMessages = [...messages, { sender: "1", message: input }];
    setMessages(updatedMessages);
    setLoading(false);
    setInput("");

    const messageFromAi = await sendMessageToAi();
    console.log("messageFromAi:", messageFromAi);
    const updatedMessagesFromAi = [
      ...updatedMessages,
      { sender: "2", message: messageFromAi },
    ];
    setMessages(updatedMessagesFromAi);
  };

  function formatNames(names) {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  const playerNameStyles = {
    [playersNames[0]]: "text-[var(--chat-1)]",
    [playersNames[1]]: "text-[var(--chat-2)]",
    [playersNames[2]]: "text-[var(--chat-3)]",
    [playersNames[3]]: "text-[var(--chat-4)]",
  };

  console.log(playersNames);
  return (
    <div className={"flex flex-col p-4 min-h-screen max-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3"}>
        <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
          {playersNames.map((name, index) => (
            <span key={name} className={`${playerNameStyles[name]} px-1`}>
              {name}
              {index < playersNames.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          have joined the room.
        </p>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xs p-2 rounded-lg  ${senderStyles[msg.sender]}`}
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
        <Button onClick={handleSendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Room;
