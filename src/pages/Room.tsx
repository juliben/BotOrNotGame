import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const exampleMessages = [
  {
    sender: "1",
    message: "Hello",
  },
  {
    sender: "2",
    message: "Hi",
  },
  {
    sender: "3",
    message: "How are you?",
  },
  {
    sender: "4",
    message: "I'm fine, thanks!",
  },
];

const senderStyles = {
  "1": "self-end bg-[var(--chat-1)] text-foreground mr-2", // Right-aligned bubble for sender 1
  "2": "self-start bg-[var(--chat-2)] text-foreground ml-2", // Left-aligned bubble for sender 2
  "3": "self-start bg-[var(--chat-3)] text-foreground ml-2", // Left-aligned bubble for sender 3
  "4": "self-start bg-[var(--chat-4)] text-foreground ml-2", // Left-aligned bubble for sender 4
};

const Room = () => {
  const [message, setMessage] = useState("");
  const { roomId } = useParams();
  return (
    <div className={"flex flex-col p-4 min-h-screen"}>
      <Card className={"flex-1 overflow-y-scroll mb-3"}>
        {exampleMessages.map((msg, index) => (
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />{" "}
        <Button>Send</Button>
      </div>
    </div>
  );
};

export default Room;
