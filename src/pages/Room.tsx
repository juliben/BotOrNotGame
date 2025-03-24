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
import { ping } from "@/services/ping.ts";
import { processVotes } from "@/services/processVotes.ts";
import { getFirstMessageFromAi } from "@/services/getFirstMessageFromAi.ts";
import { useAnimate, motion } from "motion/react";
import { assignNumbersToPlayers } from "@/services/assignNumbersToPlayers.ts";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10000);
  const [isVoting, setIsVoting] = useState(false);
  const [votingCountdown, setVotingCountdown] = useState(10000);
  const [winner, setWinner] = useState(null);
  const [votes, setVotes] = useState([]);
  const [winnerScreenVisible, setWinnerScreenVisible] = useState(false);
  const [scope, animate] = useAnimate();
  const [animationStep2, setAnimationStep2] = useState(false);

  // To make sure the first message from the AI is only requested once
  const [sentFirstMessage, setSentFirstMessage] = useState(false);

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

  // Get a delegated user to send requests
  const getLeaderId = () => {
    if (!namesWithIdsRef.current || namesWithIdsRef.current.length === 0)
      return null;
    // Map to IDs and sort them lexicographically
    const sortedIds = namesWithIdsRef.current
      .map((user) => user.user_id)
      .filter((id) => id !== "51fa8d86-ff0e-45ad-b4a0-06c3b8fdab93")
      .sort();
    return sortedIds[0];
  };




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

  // Get responses from AI
  useEffect(() => {
    if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0].sender === AI_USER_ID)
    ) {
      return;
    }

    if (
      messages.length > 1 &&
      messages[messages.length - 1].sender === AI_USER_ID
    ) {
      console.log("Last message was from AI");
      return;
    }

    const leaderId = getLeaderId();
    if (leaderId !== userId) {
      return;
    }

    console.log("Sending messages to AI");
    sendMessagesToAi();
  }, [messages]);

  // First message from AI?
  useEffect(() => {
    if (sentFirstMessage) {
      console.log("Already sent first message");
      return;
    }
    const leaderId = getLeaderId();
    if (leaderId !== userId) {
      return;
    }
    const aiUser = namesWithIds.find((name) => name.is_ai === true);
    if (!aiUser) {
      console.log("AI user not found (getFirstMessageFromAi)");
      return;
    }
    if (!flipCoin()) {
      console.log("Skipping first message from AI");
      return;
    }
    getFirstMessageFromAi(aiUser.game_name, aiUser.avatar, roomId);
    setSentFirstMessage(true);
  }, [namesWithIds, roomId]);

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the messages container
  useEffect(() => {
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

            // // This is the timer to count the votes after 12 seconds. It should be cleared in the votes channel subscription if enough votes are counted before the timeout
            // startVotingTimer();
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
              setWinnerScreenVisible(true);
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
            avatar: payload.new.avatar,
            is_ai: payload.new.is_ai,
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

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (input === "") return;
    if (!userId) return;

    const myUser = namesWithIds.find((name) => name.user_id === userId);
    if (!myUser) return;

    const myAvatar = myUser.avatar;
    const myName = myUser.game_name;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        room_id: roomId,
        content: input,
        game_name: myName,
        avatar: myAvatar,
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
    const aiUser = namesWithIds.find((name) => name.is_ai === true);
    if (!aiUser) return;
    const aiName = aiUser.game_name;

    try {
      const response = await axios.post("http://localhost:3000/spanish", {
        messages,
      });

      const isAppropriate =
        response.data.shouldRespond === true && response.data.confidence >= 0.7;

      if (!isAppropriate) {
        console.log("AI response is not appropriate, skipping...");
        return;
      }
      /// Split the response into sentences to appear more human
      let initialSentences = response.data.response.split(/(?<=[.?!"])\s+/);

      let sentences = initialSentences.flatMap((sentence) => {
        // More casual spelling
        sentence = sentence
          .trim()
          .replace(/[¿¡]/g, "") // remove all ¿ and ¡ characters
          .replace(/[.!"]$/, ""); // then remove trailing punctuation if needed

        // 50% chance of 'haha' or 'jaja' sent in a different message
        if (flipCoin()) {
          return sentence
            .split(/(\b(?:haha|jaja)\b)(?=\s*$)/gi)
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        } else {
          return [sentence];
        }
      });

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
          room_id: roomId,
          avatar: aiUser.avatar,
        });
        if (error) {
          console.log("Error sending sentence to Supabase:", error);
        }
      }
    } catch (error) {
      if (error.status === 429) {
        console.log("Another AI request in progress.");
      }
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

    const myAvatar = namesWithIds.find(
      (name) => name.user_id === userId
    )?.avatar;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        content: `${myName} voted for ${hisName}`,
        room_id: roomId,
        avatar: myAvatar,
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
      console.log("Fetching players names and ids, players: ", players);

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
    1: "text-[#E0D9F7] ", // Light blue for player 1
    2: "text-[#D0E8F8] ", // Light green for player 2
    3: "text-[#A0F1F5] ", // Light red for player 3
    4: "text-[#E6B3E6] ", // Light purple for player 4
  };

  const playerVoteStyles = {
    1: "text-[#E0D9F7] font-medium", // Light blue for player 1
    2: "text-[#D0E8F8] font-medium", // Light green for player 2
    3: "text-[#A0F1F5] font-medium", // Light red for player 3
    4: "text-[#E6B3E6] font-medium", // Light purple for player 4
  };

  const messageBubbleStyles = {
    1: "bg-[#6A5ACD] text-white", // Dark blue for player 1
    2: "bg-[#5C8BC0] text-white", // Dark green for player 2
    3: "bg-[#009BA0] text-white", // Dark red for player 3
    4: "bg-[#660066] text-white", // Dark purple for player 4
  };

  const myAvatar = namesWithIds.find((name) => name.user_id === userId)?.avatar;

  return (
    <div className={`flex flex-col p-4 min-h-dvh max-h-dvh bg-[#353b85] `}>
      {winner && <p>Winner: {winner.game_name}</p>}
      <p
        className={`self-end mb-3 font-press-start text-xs  ${
          countdown > 30 ? "text-foreground" : "text-red-500"
        }`}
      >
        {countdown}
      </p>
      <button onClick={() => setIsVoting(true)}>Debug</button>
      <Card
        className={`flex-1 overflow-y-scroll  mb-3 py-3 gap-3 bg-background ${
          isVoting || winnerScreenVisible ? " blur-xs pointer-events-none" : ""
        } `}
      >
        {playersMap[userId] && (
          <p className="m-2 p-2  border-black border border-dotted rounded-lg text-foreground">
            {shuffledNames.map((player, index) => (
              <span
                key={player.user_id}
                className={`${
                  playerNameStyles[player.number]
                } px-1 font-medium `}
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
          // This is to check whether to display avatar image in message bubble or not
          const isLastMessage =
            index === messages.length - 1 ||
            messages[index + 1].sender !== msg.sender;

          return (
            <div
              className={`${
                msg.sender === userId ? "self-end" : "self-start"
              } flex flex-row items-end relative`}
            >
              {isLastMessage &&
                msg.sender !== userId &&
                !msg.is_from_server &&
                !msg.is_vote && (
                  <img
                    src={`/avatars/Cute-portraits_${msg.avatar}.png`}
                    className="rounded-full w-7 h-7 ml-2 mb-0.5"
                  />
                )}
              {!isLastMessage &&
                msg.sender !== userId &&
                !msg.is_from_server &&
                !msg.is_vote && (
                  <div className="rounded-full w-7 h-7 ml-2 mb-0.5 bg-transparent" />
                )}
              <div
                key={index}
                className={`${
                  msg.sender === userId
                    ? "self-end"
                    : msg.is_from_server
                    ? "self-center"
                    : "self-start"
                } ${
                  msg.is_vote
                    ? `${playerVoteStyles[senderNumber]}`
                    : msg.is_from_server
                    ? "bg-gray-200 text-gray-800"
                    : `message-bubble ${messageBubbleStyles[senderNumber]}`
                } max-w-xs p-2 rounded-lg mx-2 `}
              >
                <div>
                  <div className={"flex flex-col "}>
                    {!msg.is_vote && !msg.is_from_server && (
                      <p className={`${playerNameStyles[senderNumber]}`}>
                        ~{msg.sender_name}
                      </p>
                    )}
                    <div className="flex flex-row items-center gap-2">
                      <p>{msg.message}</p>
                    </div>
                  </div>

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Tail: only add if this is the last message and not a server message */}
              {isLastMessage && !msg.is_from_server && (
                <div
                  className={`absolute -bottom-2 ${
                    msg.sender === userId ? "right-4" : "left-4"
                  }`}
                >
                  {/* The triangle is created using borders.
                Adjust border colors to match your message bubble background */}
                  {/* <div
                    className={`w-0 h-0 border-10 border-transparent ${messageBubbleStyles[senderNumber]}
                    }`}
                  /> */}
                </div>
              )}
              {isLastMessage && msg.sender === userId && (
                <img
                  src={`/avatars/Cute-portraits_${myAvatar}.png`}
                  className="rounded-full w-7 h-7 mr-2 mb-0.5"
                />
              )}
              {!isLastMessage && msg.sender === userId && (
                <div className="rounded-full w-7 h-7 mr-2 mb-0.5 bg-transparent" />
              )}
            </div>
          );
        })}
      </Card>

      <div
        className={`flex gap-2 mt-auto ${
          isVoting || winnerScreenVisible ? " blur-xs pointer-events-none" : ""
        }`}
      >
        <form onSubmit={handleSendMessage} className="flex gap-2 min-w-full">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button onClick={handleSendMessage} disabled={loading}>
            Send
          </Button>
        </form>
      </div>

      {isVoting && (
        <div className="fixed inset-0 flex items-center justify-center font-press-start text-x ">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="p-4 m-4 w-full mb-20"
          >
            <p className="text-center text-red-400 mb-3">{votingCountdown}</p>
            <h1 className="text-center font-bold mb-5 ">Who's the bot?</h1>
            <div className="flex flex-row flex-wrap item-center justify-center gap-0">
              {shuffledNames.map((player) =>
                player.user_id === userId ? null : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={() => handleVote(player.user_id)}
                      className={`flex items-center justify-center rounded-lg w-auto h-auto shadow-xl mx-2 mb-2  ${
                        messageBubbleStyles[player.number]
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <img
                          src={`/avatars/Cute-portraits_${player.avatar}.png`}
                          className="rounded-full h-14 w-14 ring shadow-xs"
                        />
                        <p className={`text-foreground`}>{player.game_name}</p>
                      </div>
                    </Button>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        </div>
      )}

      {winner && winnerScreenVisible && !animationStep2 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          onClick={() => {
            setWinnerScreenVisible(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 "
        >
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start ">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: -50 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              The chat voted for...
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [1], y: -50 }}
              transition={{
                duration: 1,
                ease: "easeOut",
                delay: 0.75,
              }}
              className="flex items-center flex-col gap-4"
            >
              <motion.img
                animate={{ rotateY: [0, 1080] }}
                transition={{ delay: 0.75, duration: 1.5, ease: "easeOut" }}
                onAnimationComplete={() => {
                  setAnimationStep2(true);
                }}
                src={`/avatars/Cute-portraits_${winner.avatar}.png`}
                alt="Winner's avatar"
                className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
              />
            </motion.div>
          </div>
        </motion.button>
      )}

      {winner && winnerScreenVisible && animationStep2 && (
        <button
          onClick={() => {
            {
              setWinnerScreenVisible(false);
              setAnimationStep2(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 "
        >
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl   p-8 font-press-start">
            <motion.p
              initial={{ y: 0 }}
              animate={{ opacity: 0, y: -100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              The chat voted for...
            </motion.p>
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ y: -130 }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
              className="flex items-center flex-col gap-4"
            >
              <motion.img
                src={`/avatars/Cute-portraits_${winner.avatar}.png`}
                alt="Winner's avatar"
                className="w-16 h-16 rounded-full ring-4 shadow-md mt-3"
              />
              <p className="text-xl">{winner.game_name}</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0, 1, 0, 1],
                }}
                transition={{
                  delay: 1.75,
                  ease: "linear",
                  times: [0, 0.1, 0.2, 0.3, 0.4, 1],
                }}
                className="text-red-400"
              >
                {winner.user_id === AI_USER_ID && "AI DETECTED"}
                {winner.user_id !== AI_USER_ID && "NOT AN AI"}
              </motion.p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -120 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.75, duration: 0.25, ease: "easeOut" }}
              className="text-xl  text-center text-red-400"
            >
              {winner.user_id === userId && "YOU WIN!"}
              {winner.user_id === AI_USER_ID && "HUMANS WIN!"}
              {winner.user_id !== AI_USER_ID && "HUMANS LOSE!"}
            </motion.h1>
            <motion.button
              initial={{ opacity: 0, y: -110 }}
              animate={{ opacity: 1, y: -110 }}
              transition={{ delay: 4 }}
              className="
  relative
  bg-[#F11493]         /* Vibrant cyberpunk pink background */
  text-white
  font-mono
  border-4
  border-[#FF40DA]      /* Neon purple-pink border */
  px-5
  py-2
  uppercase
  tracking-wider
  rounded-none          /* No rounding for a pixelated feel */
  hover:bg-[#FF40DA]    /* On hover, swap background to neon purple-pink */
  active:bg-[#FF86D4]   /* On click/active, lighten it a bit */
  focus:outline-none
  transition-all
  shadow-[0_0_8px_#FF40DA]  /* Subtle neon glow shadow */
  hover:shadow-[0_0_12px_#FF40DA]
"
            >
              Return
            </motion.button>
          </div>
        </button>
      )}
    </div>
  );
};

export default Room;
