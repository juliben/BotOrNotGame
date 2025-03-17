import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@radix-ui/react-label";
import { Icons } from "@/components/ui/spinner";
import axios from "axios";
import { motion } from "motion/react";

import { IoDice } from "react-icons/io5";

import { useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import { getUserId } from "@/services/getUserId";
import { ping } from "@/services/ping";

const ChooseName = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

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
      pingInterval = setInterval(ping, 30000);
    };

    startPinging();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [userId]);

  const handleReady = async () => {
    const userId = await getUserId();

    const { error } = await supabase
      .from("players")
      .update([{ is_ready: !ready, game_name: name }])
      .eq("user_id", userId);
    if (error) {
      console.log("Error updating player:", error);
    }
    console.log("Set ready state to:", !ready);
    setReady(!ready);
  };

  const generateName = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/name");
      console.log(response.data.name);
      return response.data.name;
    } catch {
      console.log("Error generating name");
    } finally {
      setLoading(false);
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

  const handleGenerateName = async () => {
    const generatedName = await generateName();
    setName(getFirstName(generatedName));
  };

  return (
    <div className="flex flex-col p-4 justify-center items-center gap-5 mt-20 font-jersey text-2xl text-center">
      <div className="bg-[var(--gradient)] h-full w-full rounded-full absolute -z-1 blur-3xl opacity-50" />

      <div className="flex flex-col p-4 gap-5">
        <p>Choose a name:</p>
        <div className={"flex row gap-3 justify-center"}>
          <Input
            type="text"
            className="w-2/3"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={handleGenerateName}
            className="flex justify-center items-center"
            disabled={loading}
          >
            <IoDice className={""} />
          </Button>
        </div>
        <div className="flex flex-row justify-center items-center gap-2">
          <Checkbox
            checked={ready}
            onCheckedChange={handleReady}
            disabled={name === ""}
          />
          <Label className={name === "" ? "text-muted-foreground" : ""}>
            I'm ready
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ChooseName;
