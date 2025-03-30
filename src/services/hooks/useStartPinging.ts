import { useEffect } from "react";
import { ping } from "../index";

export const useStartPinging = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;
    let pingInterval: any;
    console.log("Attempting to ping online status, userId:", userId);
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
};
