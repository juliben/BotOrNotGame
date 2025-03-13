import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";
import { shuffle } from "lodash";

import { getUserId } from "@/services/getUserId.ts";
import { fetchParticipants } from "@/services/fetchParticipants.ts";
import { fetchParticipantNames } from "@/services/fetchParticipantNames.ts";
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";
import { BugIcon } from "lucide-react";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isVoting, setIsVoting] = useState(false);
  const [votingCountdown, setVotingCountdown] = useState(10);

  const [mostVoted, setMostVoted] = useState(null);

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

  // Counter to trigger voting
  useEffect(() => {
    const counter = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(counter);
            setIsVoting(true);
            startVotingCountdown();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(counter);
  }, []);

  // Callback function for voting countdown
  const startVotingCountdown = () => {
    const counter = setInterval(() => {
      if (votingCountdown > 0) {
        setVotingCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(counter);
            setIsVoting(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  };

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
            is_vote: payload.new.is_vote,
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
      let sentences = response.data.split(/(?<=[.?!"])\s+/);
      sentences = sentences
        .filter((sentence) => sentence.trim().length > 0)
        .map((sentence) => sentence.trim().replace(/[.¿¡!]$/, ""));

      // Process each sentence sequentially.
      for (const sentence of sentences) {
        // Calculate the delay for this sentence (e.g., 50ms per character)
        const sentenceDelay = sentence.length * 100;
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

  const handleVote = async (voted) => {
    try {
      const { error } = await supabase
        .from("players")
        .update({ voted_for: voted })
        .eq("user_id", userId);
      if (error) {
        console.log("Error sending vote to Supabase:", error);
        setIsVoting(false);
      }
      setIsVoting(false);
      await sendMyVoteAsMessage(voted);
      await fetchAllVotes();
    } catch (error) {
      console.log("Error sending vote:", error);
    }
  };

  const fetchAllVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("game_name, voted_for")
        .eq("room_id", roomId);

      if (error) {
        console.log("Error fetching votes from Supabase:", error);
      }

      const votesCount = data.reduce((acc, player) => {
        acc[player.voted_for] = (acc[player.voted_for] || 0) + 1;
        return acc;
      }, {});

      const mostVoted = Object.entries(votesCount).reduce(
        (max, [candidate, count]) => {
          return count > max.count ? { candidate, count } : max;
        },
        { candidate: null, count: 0 }
      ).candidate;

      console.log("Vote counts:", votesCount);

      const mostVotedPlayer = namesWithIds.find(
        (player) => player.user_id === mostVoted
      );

      console.log("Most voted:", mostVotedPlayer);
      return votesCount;
    } catch (error) {
      console.log("Error fetching votes:", error);
    }
  };

  const sendMyVoteAsMessage = async (voted) => {
    const myName = namesWithIds.find(
      (name) => name.user_id === userId
    )?.game_name;
    if (!myName) return;

    const hisName = namesWithIds.find(
      (name) => name.user_id === voted
    )?.game_name;
    if (!hisName) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        content: `${myName} voted for ${hisName}`,
        is_vote: true,
      });
      if (error) {
        console.log("Error sending vote message to Supabase:", error);
      }
    } catch (error) {
      console.log("Error sending vote message:", error);
    }
  };

  useEffect(() => {
    const fetchPlayerNamesAndIds = async () => {
      const players = await fetchParticipantNames(roomId);

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

  const playerVoteStyles = {
    1: "text-[#0066CC] font-medium", // Light blue for player 1
    2: "text-[#006600] font-medium", // Light green for player 2
    3: "text-[#990000] font-medium", // Light red for player 3
    4: "text-[#660066] font-medium", // Light purple for player 4
  };

  const messageBubbleStyles = {
    1: "bg-[#0066CC] text-white mx-2", // Dark blue for player 1
    2: "bg-[#006600] text-white mx-2", // Dark green for player 2
    3: "bg-[#990000] text-white mx-2", // Dark red for player 3
    4: "bg-[#660066] text-white mx-2", // Dark purple for player 4
  };

  return (
    <div className={`flex flex-col p-4 min-h-screen max-h-screen `}>
      <p
        className={`self-end mb-3  ${
          countdown > 30 ? "text-foreground" : "text-red-500"
        }`}
      >
        {countdown}
      </p>
      <Card
        className={`flex-1 overflow-y-scroll mb-3 py-3 gap-3 ${
          isVoting ? " blur-xs pointer-events-none" : ""
        } `}
      >
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
                className={`${
                  msg.sender === userId ? "self-end" : "self-start"
                } ${
                  msg.is_vote
                    ? `${playerVoteStyles[senderNumber]}`
                    : `message-bubble ${messageBubbleStyles[senderNumber]}`
                } max-w-xs p-2 rounded-lg  `}
              >
                <div className={"flex flex-col "}>
                  {!msg.is_vote && (
                    <p className={`${playerNameStyles[senderNumber]}`}>
                      ~{msg.sender_name}
                    </p>
                  )}
                  <p>{msg.message}</p>
                </div>
                <div ref={messagesEndRef} />
              </div>
            </>
          );
        })}
      </Card>

      <div
        className={`flex gap-2 mt-auto ${
          isVoting ? " blur-xs pointer-events-none" : ""
        }`}
      >
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />{" "}
        <Button onClick={() => setIsVoting(!isVoting)} disabled={loading}>
          <BugIcon />
        </Button>
        <Button onClick={handleSendMessage} disabled={loading}>
          Send
        </Button>
        <Button onClick={sendMessagesToAi}>AI</Button>
      </div>

      {isVoting && (
        <div className="fixed inset-0 flex items-center justify-center ">
          <Card className="p-4 m-4 w-full max-w-md border-black border border-dotted rounded-lg text-foreground">
            <p className="text-center text-red-400">{votingCountdown}</p>
            <h1 className="text-center text-xl font-bold ">Who is the AI?</h1>
            <div className="flex flex-col space-y-4 mb-4 justify-center items-center">
              {shuffledNames.map((player) =>
                player.user_id === userId ? null : (
                  <div
                    key={player.user_id}
                    className="flex row items-center gap-5 "
                  >
                    <Button
                      className={`${playerNameStyles[player.number]} ${
                        messageBubbleStyles[player.number]
                      } px-10 min-w-45`}
                      onClick={() => handleVote(player.user_id)}
                    >
                      {player.game_name}
                    </Button>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Room;
