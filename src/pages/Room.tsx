import { AnimationStep1 } from "./../components/AnimationStep1";
import { AnimationStep2 } from "./../components/AnimationStep2";
import { VotingModal } from "./../components/VotingModal";
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
  sendMyVoteAsMessage,
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
  const winnerRef = useRef(null);
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
      (messages.length === 1 && messages[0].is_from_ai === true)
    ) {
      return;
    }

    if (
      messages.length > 1 &&
      messages[messages.length - 1].is_from_ai === true
    ) {
      console.log("Last message was from AI");
      return;
    }

    console.log("Sending messages to AI");
    sendMessagesToAi(roomId, messages, aiUserRef.current);
  }, [messages]);

  // First message from AI?
  useEffect(() => {
    if (!roomId || !userId || leaderIdRef) {
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
          console.log("Received payload message: " + newMessage.content);
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

  const handleVote = async (votedId: string) => {
    if (!roomId || !userId) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({ voted_for: votedId })
        .eq("user_id", userId);
      if (error) {
        console.log("Error sending vote to Supabase:", error);
        setIsVoting(false);
      }
      setIsVoting(false);

      await sendMyVoteAsMessage({
        roomId,
        userId,
        playersMap,
        votedId,
      });
    } catch (error) {
      console.log("Error sending vote:", error);
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
        className={`flex-1 overflow-y-scroll  mb-3 pt-3 pb-0 gap-3 bg-background ${
          isVoting || winnerScreenVisible ? " blur-xs pointer-events-none" : ""
        } `}
      >
        {playersMap && <PlayerNames playersMap={playersMap} />}
        {playersMap && userId && (
          <>
            <Messages
              messages={messages}
              playersMap={playersMap}
              userId={userId}
            />
            <div ref={messagesEndRef} />
          </>
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

      {isVoting && userId && (
        <VotingModal
          userId={userId}
          playersMap={playersMap}
          votingCountdown={votingCountdown}
          handleVote={handleVote}
        />
      )}

      {winner && winnerScreenVisible && !animationStep2 && (
        <AnimationStep1
          winner={winner}
          setWinnerScreenVisible={setWinnerScreenVisible}
          setAnimationStep2={setAnimationStep2}
        />
      )}

      {winner && winnerScreenVisible && animationStep2 && (
        <AnimationStep2 winner={winner} userId={userId} />
      )}
    </div>
  );
};

export default Room;
