import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import supabase from "../api/supabase";
import { Button, Input } from "@/components/ui";

import { Messages } from "./../components/Messages.tsx";
import { PlayerNames } from "./../components/PlayerNames.tsx";
import { VotingModal } from "./../components/VotingModal.tsx";
import { AnimationStep1 } from "./../components/AnimationStep1.tsx";
import { AnimationStep2 } from "./../components/AnimationStep2.tsx";

import {
  getUserId,
  getLeaderId,
  fetchPlayers,
  sendMyVoteAsMessage,
} from "../services/";

import { User } from "../../types.ts";
import {
  useFirstMessageFromAi,
  useMainCountdown,
  useMessagesChannel,
  useSendMessagesToAi,
  useStartPinging,
  useVoteChannel,
} from "@/services/hooks/";
import { useGetAiUser } from "@/services/hooks/useGetAiUser.ts";

const Room = () => {
  const [input, setInput] = useState("");
  const { countdown, isVoting } = useMainCountdown();
  const [votingCountdown, setVotingCountdown] = useState(10000);

  const [winnerScreenVisible, setWinnerScreenVisible] = useState(false);
  const [animationStep2, setAnimationStep2] = useState(false);

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

  useStartPinging(userId);
  const messages = useMessagesChannel({ roomId });

  const leaderIdRef = useRef<string | null>(null);
  // Get a new? leader when playersMap changes (someone disconnects)
  useEffect(() => {
    if (!playersMap || Object.keys(playersMap).length === 0) return;
    leaderIdRef.current = getLeaderId(playersMap);
  }, [playersMap]);
  const isLeader = leaderIdRef.current === userId;

  const aiUserRef = useRef<User | null>(null);
  useGetAiUser({ playersMap, aiUserRef });

  // For scrolling to bottom on new messages
  const messagesEndRef = useRef(null);

  const allOk = !!(roomId && userId && aiUserRef.current && playersMap);

  useFirstMessageFromAi({
    allOk,
    isLeader,
    roomId,
    aiUserRef,
  });

  useSendMessagesToAi({
    allOk,
    isLeader,
    messages,
    roomId,
    aiUserRef,
  });

  const winner = useVoteChannel({
    roomId,
    setWinnerScreenVisible,
  });

  // Scroll to the bottom of the messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Callback function for voting countdown
  // const startVotingCountdown = () => {
  //   const counter = setInterval(() => {
  //     if (votingCountdown > 0) {
  //       setVotingCountdown((prev) => {
  //         if (prev <= 0) {
  //           clearInterval(counter);
  //           setIsVoting(false);
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }
  //   }, 1000);
  // };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (input === "") return;
    if (!allOk) return;

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
    if (!allOk) return;

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

  return (
    <div className={`flex flex-col p-4 min-h-dvh max-h-dvh bg-[#353b85] `}>
      <p
        className={`self-end mb-3 font-press-start text-xs  ${
          countdown > 30 ? "text-foreground" : "text-red-500"
        }`}
      >
        {countdown}
      </p>
      <button onClick={() => setIsVoting(true)}>Debug</button>
      <div
        className={`chatbox ${isVoting ? "blur-xs pointer-events-none" : ""}`}
      >
        {playersMap && <PlayerNames playersMap={playersMap} />}
        {playersMap && userId && (
          <>
            <Messages
              messages={messages ?? []}
              playersMap={playersMap}
              userId={userId}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
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
          <Button onClick={handleSendMessage}>Send</Button>
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
      {winner && winnerScreenVisible && animationStep2 && userId && (
        <AnimationStep2
          winner={winner}
          userId={userId}
          setWinnerScreenVisible={setWinnerScreenVisible}
        />
      )}
    </div>
  );
};

export default Room;
