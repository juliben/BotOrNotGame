import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { send } from "process";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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
      console.log("data.message:", data.message);

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

  return (
    <div className={"flex flex-col p-4 min-h-screen max-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3"}>
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
