import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import supabase from "../api/supabase";
import { shuffle } from "lodash";
import flipCoin from "@/services/flipCoin.ts";

import { getUserId } from "@/services/getUserId.ts";
import { fetchParticipants } from "@/services/fetchParticipants.ts";
import { fetchParticipantNames } from "@/services/fetchParticipantNames.ts";
import { AI_USER_ID } from "../../constants.ts";
import axios from "axios";
import { BugIcon } from "lucide-react";
import { ping } from "@/services/ping.ts";
import { processVotes } from "@/services/processVotes.ts";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(100000);
  const [isVoting, setIsVoting] = useState(false);
  const [votingCountdown, setVotingCountdown] = useState(10);
  const [winner, setWinner] = useState(null);
  const [votes, setVotes] = useState([]);

  const votesTimerRef = useRef(null);
  const namesWithIdsRef = useRef(null);
  const winnerRef = useRef(null);
  const votersRef = useRef([]);

  // Array of names with corresponding userIds ({ game_name, user_id })
  const [namesWithIds, setNamesWithIds] = useState([]);

  const [shuffledNames, setShuffledNames] = useState([]);
  const roomId = useParams().roomId;
  const [playersMap, setPlayersMap] = useState({});
  const [userId, setUserId] = useState(null);

  // Start pinging (online status)
  useEffect(() => {
    let pingInterval;

    if (!userId) {
      getUserId().then((id) => {
        setUserId(id);
      });
    }
    if (userId === null) {
      console.log("Ping: User ID not found");
      return;
    }
    console.log("Attempting to start pinging, userId:", userId);

    const startPinging = async () => {
      // Send initial ping
      ping(userId);

      console.log("Now pinging");

      // Send a ping every 30 seconds
      pingInterval = setInterval(() => ping(userId), 30000);
    };

    startPinging();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [userId]);

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Counter to trigger voting
  // useEffect(() => {
  //   const counter = setInterval(() => {
  //     if (countdown > 0) {
  //       setCountdown((prev) => {
  //         if (prev <= 0) {
  //           clearInterval(counter);
  //           setIsVoting(true);
  //           startVotingCountdown();

  //           // // This is the timer to count the votes after 12 seconds. It should be cleared in the votes channel subscription if enough votes are counted before the timeout
  //           // startVotingTimer();
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }
  //   }, 1000);

  //   return () => clearInterval(counter);
  // }, []);

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

  // Get user ID
  useEffect(() => {
    getUserId().then((id) => setUserId(id));
  }, []);

  // Vote channel subscription
  useEffect(() => {
    console.log("Subscribing to vote channel for roomId:", roomId);
    const channel = supabase
      .channel("vote_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.voted_for === null || payload.new.room_id != roomId) {
            return;
          }
          if (winnerRef.current) {
            return;
          }

          const vote = {
            vote: payload.new.voted_for,
          };
          const voter = payload.new.user_id;

          // Check if it is a duplicate vote

          if (votersRef.current === null) {
            votersRef.current = [];
          }
          if (votersRef.current.includes(voter)) {
            return;
          }

          votersRef.current = [...votersRef.current, voter];

          console.log("Received payload vote: " + vote.vote);
          setVotes((prevVotes) => {
            const updatedVotes = [...prevVotes, vote];
            if (updatedVotes.length >= 3) {
              clearInterval(votesTimerRef.current);
              const winner = processVotes(
                updatedVotes,
                namesWithIdsRef.current,
                roomId
              );
              winnerRef.current = winner;
              setWinner(winner);
            }
            return updatedVotes;
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from vote channel");
      channel.unsubscribe();
    };
  }, []);

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

          const newMessage = {
            sender: payload.new.sender_id,
            sender_name: payload.new.game_name,
            message: payload.new.content,
            is_vote: payload.new.is_vote,
            is_from_server: payload.new.is_from_server,
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
  }, [roomId]);

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
        room_id: roomId,
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

      /// Split the response string into sentences.
      let initialSentences = response.data.split(/(?<=[.?!"])\s+/);

      let sentences = initialSentences.flatMap((sentence) => {
        // Clean up each sentence.
        sentence = sentence.trim().replace(/[.¿¡!]$/, "");

        // Use your flipCoin() function to decide if further splitting should occur.
        if (flipCoin()) {
          return sentence
            .split(/(\b(?:haha|jaja)\b)/gi)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        } else {
          return [sentence];
        }
      });

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
          room_id: roomId,
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
    } catch (error) {
      console.log("Error sending vote:", error);
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
        room_id: roomId,
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
        namesWithIdsRef.current = players;
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

  const startVotingTimer = () => {
    votesTimerRef.current = setTimeout(() => {
      console.log("Voting time ended (timeout reached).");
      const winner = processVotes(votes, namesWithIds);
      setWinner(winner);

      // Add the AI's vote to the messages array (not in Supabase)
      const aiName = namesWithIds.find(
        (name) => name.user_id === AI_USER_ID
      )?.game_name;
      if (!aiName) return;

      const newAiMessage = {
        sender_id: AI_USER_ID,
        content: `${aiName} voted for ${winner.game_name}`,
        room_id: roomId,
        is_vote: true,
      };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    }, 12000);
  };

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
      {winner && <p>Winner: {winner.game_name}</p>}
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
            <div
              key={index}
              className={`${
                msg.sender === userId ? "self-end" : "self-start"
              } ${
                msg.is_vote
                  ? `${playerVoteStyles[senderNumber]}`
                  : msg.is_from_server
                  ? "bg-gray-200 text-gray-800 self-center text-center mx-auto"
                  : `message-bubble ${messageBubbleStyles[senderNumber]}`
              } max-w-xs p-2 rounded-lg  `}
            >
              <div className={"flex flex-col "}>
                {!msg.is_vote && !msg.is_from_server && (
                  <p className={`${playerNameStyles[senderNumber]}`}>
                    ~{msg.sender_name}
                  </p>
                )}
                <p>{msg.message}</p>
              </div>
              <div ref={messagesEndRef} />
            </div>
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
        <Button onClick={() => console.log(votes)} disabled={loading}>
          Votes
        </Button>
        <Button onClick={() => setIsVoting(true)} disabled={loading}>
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
