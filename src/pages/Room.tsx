import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";
import { shuffle } from "lodash";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Array of names with corresponding userIds ({ game_name, user_id })
  const [namesWithIds, setNamesWithIds] = useState([]);

  const roomId = useParams().roomId;
  const userId = localStorage.getItem("userId");

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
          console.log("Received payload:" + payload.new);
          const newMessage = {
            sender: payload.new.sender_id,
            message: payload.new.content,
          };
          console.log(newMessage);
          setMessages((messages) => [...messages, newMessage]);
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, []);

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

      if (data.players[0] === userId) {
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

      await generateNameForAi();

      fetchParticipantNames();

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

  // This is to be executed after AddAIToRoom function, inside
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

      const humanPlayersNamesWithIds = data.map((player) => ({
        game_name: player.game_name,
        user_id: player.user_id,
      }));
      console.log(humanPlayersNamesWithIds);

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

      const AI_NAME_AND_ID = {
        game_name: aiName.game_name,
        user_id: AI_USER_ID,
      };

      const allPlayersNames = [...humanPlayersNamesWithIds, AI_NAME_AND_ID];
      setNamesWithIds(allPlayersNames);
    } catch (error) {
      console.log("Error fetching participants names:", error);
    }
  };

  const generateNameForAi = async () => {
    try {
      console.log("Generating name for AI...");
      const response = await axios.get("http://localhost:3000/name");

      const generatedName = response.data.name;
      const firstName = getFirstName(generatedName);

      const { error } = await supabase
        .from("players")
        .update({ game_name: firstName })
        .eq("user_id", AI_USER_ID);

      if (error) {
        console.log("Error updating AI's name in Supabase:", error);
      }
      console.log("Updated AI's name in Supabase:" + firstName);
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

  const getFirstMessageFromAi = async () => {
    try {
      console.log("Getting first message from AI");
      const response = await axios.get("http://localhost:3000/first-message");
      console.log("Response from AI:", response);
      const messageFromAi = response.data;

      // Send that message to Supabase

      const { error } = await supabase
        .from("messages")
        .insert({ sender_id: AI_USER_ID, content: messageFromAi });

      if (error) {
        console.log("Error sending first message from AI to Supabase:", error);
      }
    } catch {
      console.log("Error getting first message from AI");
    }
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

  const names = namesWithIds.map((player) => player.game_name);

  // Correspond the shuffledNames indexes to the playerNameStyles
  const shuffledNames = shuffle(names);

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
        {/* <Button variant="secondary" onClick={() => console.log(namesWithIds)}> */}
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
