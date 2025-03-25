import { ReturnButton } from "./../components/ui/ReturnButton";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import supabase from "../api/supabase";
import { motion } from "motion/react";

import {
  flipCoin,
  getUserId,
  sendMessagesToAi,
  getFirstMessageFromAi,
  processVotes,
  ping,
  getLeaderId,
  fetchPlayers,
} from "../services/";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Message, User } from "../../types.ts";
import PlayerNames from "@/components/PlayerNames.tsx";
import { Messages } from "@/components/Messages.tsx";

const Room = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10000);
  const [isVoting, setIsVoting] = useState(false);
  const [votingCountdown, setVotingCountdown] = useState(10000);
  const [winner, setWinner] = useState<User | null>(null);
  const [votes, setVotes] = useState([]);
  const [winnerScreenVisible, setWinnerScreenVisible] = useState(false);
  const [animationStep2, setAnimationStep2] = useState(false);

  // To make sure the first message from the AI is only requested once
  const [sentFirstMessage, setSentFirstMessage] = useState(false);

  const votesTimerRef = useRef(null);
  // const winnerRef = useRef(null);
  const votersRef = useRef([]);

  // Important data coming from the Lobby
  const roomId = useParams().roomId;
  const location = useLocation();
  const [playersMap, setPlayersMap] = useState<Record<string, Partial<User>>>(
    () => {
      return (location.state as { playersMap: any })?.playersMap || {};
    }
  );
  const [userId, setUserId] = useState<string | null>(() => {
    return (location.state as { userId: any })?.userId || null;
  });
  //

  const aiUserRef = useRef<User | null>(null);
  const leaderIdRef = useRef<string | null>(null);

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef(null);

  // Get a delegated user to send requests
  // I have to use this function elsewhere, that's why it's outside the useEffect

  // Initial refetch just in case
  useEffect(() => {
    if (!userId) {
      getUserId().then((userId) => {
        if (!userId) return;
        setUserId(userId);
      });
    }
    if (!roomId) return;
    fetchPlayers({ roomId }).then((playersMap) => {
      if (!playersMap) return;
      setPlayersMap(playersMap);
    });
  }, []);

  // Get a new? leader when playersMap changes (someone disconnects)
  useEffect(() => {
    if (!playersMap) return;
    leaderIdRef.current = getLeaderId(playersMap);
  }, [playersMap]);

  // Get user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const userId = await getUserId();
      setUserId(userId);
    };
    getCurrentUser();
  }, []);

  // Get the AI user ID and save a ref
  useEffect(() => {
    console.log("Players map: ", playersMap);

    const getAiUser = () => {
      const aiUserKey = Object.keys(playersMap).find(
        (key) => playersMap[key].is_ai === true
      );
      return aiUserKey ? playersMap[aiUserKey] : null;
    };
    aiUserRef.current = getAiUser();
    console.log("AI user: ", aiUserRef.current);
  }, []);

  // Start pinging (online status)
  useEffect(() => {
    let pingInterval;

    if (!userId) {
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
    if (!aiUserRef.current || !roomId) {
      console.log("AI or roomId not found (sendMessagesToAi)");
      return;
    }
    if (leaderIdRef.current !== userId) {
      return;
    }

    if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0].is_ai === true)
    ) {
      return;
    }

    if (messages.length > 1 && messages[messages.length - 1].is_ai === true) {
      console.log("Last message was from AI");
      return;
    }

    console.log("Sending messages to AI");
    sendMessagesToAi(roomId, messages, aiUserRef.current);
  }, [messages]);

  // First message from AI?
  useEffect(() => {
    if (!roomId) {
      return;
    }
    if (!userId) {
      console.log("User Id found");
      return;
    }

    if (leaderIdRef.current !== userId) {
      console.log(`I (${playersMap[userId].game_name}) am not the leader`);
      console.log(`The leader is ${playersMap[leaderIdRef.current].game_name}`);
      return;
    }
    if (!aiUserRef.current) {
      console.log("AI user not found");
      return;
    }
    if (sentFirstMessage) {
      console.log("Already sent first message");
      return;
    }
    if (!flipCoin()) {
      console.log("Skipping first message from AI");
      return;
    }

    getFirstMessageFromAi(roomId, aiUserRef.current);
    setSentFirstMessage(true);
  }, [roomId]);

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
              // const winner = processVotes(
              //   updatedVotes,
              //   namesWithIdsRef.current,
              //   roomId
              // );
              // winnerRef.current = winner;
              // setWinner(winner);
              // setWinnerScreenVisible(true);
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

          const newMessage: Partial<Message> = {
            sender_id: payload.new.sender_id,
            game_name: payload.new.game_name,
            content: payload.new.content,
            is_vote: payload.new.is_vote,
            is_from_ai: payload.new.is_from_ai,
            is_from_server: payload.new.is_from_server,
            avatar: payload.new.avatar,
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

    const myUser = playersMap[userId];

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        room_id: roomId,
        content: input,
        game_name: myUser.game_name,
        avatar: myUser.avatar,
      });
      if (error) {
        console.log("Error sending message to Supabase:", error);
      }
      setInput("");
    } catch (error) {
      console.log("Error sending message:", error);
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
    if (!userId) return;

    const myUser = playersMap[userId];
    const votedUser = playersMap[voted];

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        content: `${myUser.game_name} voted for ${votedUser.game_name}`,
        room_id: roomId,
        avatar: myUser.avatar,
        is_vote: true,
      });
      if (error) {
        console.log("Error sending vote message to Supabase:", error);
      }
    } catch (error) {
      console.log("Error sending vote message:", error);
    }
  };

  const startVotingTimer = () => {
    votesTimerRef.current = setTimeout(() => {
      if (!aiUserRef.current) {
        return;
      }
      console.log("Voting time ended (timeout reached).");
      // const winner = processVotes(votes, namesWithIds);
      // setWinner(winner);

      const newAiMessage = {
        sender_id: aiUserRef.current.user_id,
        content: `${aiUserRef.current.game_name} voted for ${winner.game_name}`,
        room_id: roomId,
        is_vote: true,
      };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    }, 12000);
  };

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
        {playersMap && <PlayerNames playersMap={playersMap} />}
        {playersMap && userId && (
          <Messages
            messages={messages}
            playersMap={playersMap}
            userId={userId}
            messagesEndRef={messagesEndRef}
          />
        )}
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
              {Object.values(playersMap).map((player) =>
                player.user_id === userId ? null : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={() => handleVote(player.user_id)}
                      className={`flex bg-[var(--player-${player.number}-bubble)] items-center justify-center rounded-lg w-auto h-auto shadow-xl mx-2 mb-2  `}
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
                {winner.is_ai && "AI DETECTED"}
                {!winner.is_ai && "NOT AN AI"}
              </motion.p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -120 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.75, duration: 0.25, ease: "easeOut" }}
              className="text-xl  text-center text-red-400"
            >
              {winner.user_id === userId && "YOU WIN!"}
              {winner.is_ai && "HUMANS WIN!"}
              {!winner.is_ai && "HUMANS LOSE!"}
            </motion.h1>
            <ReturnButton />
          </div>
        </button>
      )}
    </div>
  );
};

export default Room;
