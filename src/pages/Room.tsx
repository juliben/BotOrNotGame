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
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Array of names with corresponding userIds ({ game_name, user_id })
  const [namesWithIds, setNamesWithIds] = useState([]);

  const [shuffledNames, setShuffledNames] = useState([]);
  const [userId, setUserId] = useState(null);
  const roomId = useParams().roomId;
  const [playersMap, setPlayersMap] = useState({});

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
            sender_name: payload.new.game_name,
            message: payload.new.content,
          };
          console.log("Received payload message: " + newMessage.message);
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
    fetchParticipants(roomId, userId);
  }, [roomId, userId]);

  const handleSendMessage = async () => {
    if (input === "") return;
    if (!userId) return;

    const myUser = namesWithIds.find((name) => name.user_id === userId);
    if (!myUser) return;

    const myName = myUser.game_name;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        content: input,
        game_name: myName,
      });
      if (error) {
        console.log("Error sending message to Supabase:", error);
      }
      setInput("");
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };
  // Utility function to return a promise that resolves after a given delay.
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const sendMessagesToAi = async () => {
    const aiUser = namesWithIds.find((name) => name.user_id === AI_USER_ID);
    if (!aiUser) return;
    const aiName = aiUser.game_name;

    console.log("Sending messages array to AI....");
    try {
      const response = await axios.post("http://localhost:3000/spanish", {
        messages,
      });

      console.log("Response from AI: " + response.data);

      // Split the response string into sentences.
      let sentences = response.data.split(/(?<=[.?!])\s+/);
      sentences = sentences.filter((sentence) => sentence.trim().length > 0);

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
          sender_id: AI_USER_ID,
          content: sentence,
          game_name: aiName,
        });
        if (error) {
          console.log("Error sending sentence to Supabase:", error);
        }
      }
    } catch (error) {
      console.log("Error sending message to AI:", error);
    }
  };

  const aiAskQuestion = async () => {
    const aiUser = namesWithIds.find((name) => name.user_id === AI_USER_ID);
    if (!aiUser) return;
    const aiName = aiUser.game_name;

    console.log("Requesting question from AI....");
    try {
      const response = await axios.post(
        "http://localhost:3000/ask-question-spanish",
        {
          messages,
        }
      );

      console.log("Response from AI: " + response.data); // Log the JSON response);
      console.log("Response length: " + response.data.length);
      // Calculate delay duration according to message length, to simulate typing time
      const delayDuration = response.data.length * 100;
      console.log("Delay duration: " + delayDuration);

      // Simulate delay and send response to supabase
      setTimeout(async () => {
        const { error } = await supabase.from("messages").insert({
          sender_id: AI_USER_ID,
          content: response.data,
          game_name: aiName,
        });
        if (error) {
          console.log("Error sending message to Supabase:", error);
        }
      }, delayDuration);
    } catch (error) {
      console.log("Error sending message to AI:", error);
    }
  };

  useEffect(() => {
    const fetchPlayerNamesAndIds = async () => {
      const players = await fetchParticipantNames(roomId);
      console.log("Players with name, id and number:", players);

      // Only update state if every player's number is set (non-null)
      if (players.every((player) => player.number !== null)) {
        setNamesWithIds(players);
        setShuffledNames(shuffle(players));
        const map = players.reduce((acc, player) => {
          acc[player.user_id] = player.number;
          return acc;
        }, {});
        setPlayersMap(map);
        clearInterval(intervalId);
      }
    };

    // Poll every 500 milliseconds
    const intervalId = setInterval(fetchPlayerNamesAndIds, 500);

    // Cleanup polling when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const playerNameStyles = {
    1: "text-[#99CCFF] font-medium", // Light blue for player 1
    2: "text-[#66FF66] font-medium", // Light green for player 2
    3: "text-[#FF6666] font-medium", // Light red for player 3
    4: "text-[#CC99CC] font-medium", // Light purple for player 4
  };

  const messageBubbleStyles = {
    1: "bg-[#0066CC] text-white mx-2", // Dark blue for player 1
    2: "bg-[#006600] text-white mx-2", // Dark green for player 2
    3: "bg-[#990000] text-white mx-2", // Dark red for player 3
    4: "bg-[#660066] text-white mx-2", // Dark purple for player 4
  };

  return (
    <div className={"flex flex-col p-4 min-h-screen max-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3 py-3 gap-3"}>
        {playersMap[userId] && (
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
          const senderNumber = playersMap[msg.sender];

          return (
            <>
              <div
                key={index}
                className={`max-w-xs p-2 rounded-lg ${
                  msg.sender === userId ? "self-end" : "self-start"
                } message-bubble ${messageBubbleStyles[senderNumber]}`}
              >
                <div className={"flex flex-col "}>
                  <p className={`${playerNameStyles[senderNumber]}`}>
                    ~{msg.sender_name}
                  </p>
                  <p>{msg.message}</p>
                </div>
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
        <Button variant="secondary" onClick={aiAskQuestion}>
          <IoMdBug />
        </Button>
        <Button onClick={handleSendMessage} disabled={loading}>
          Send
        </Button>
        <Button onClick={sendMessagesToAi}>AI</Button>
      </div>
    </div>
  );
};

export default Room;
