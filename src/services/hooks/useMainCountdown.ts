import { useState, useEffect } from "react";

export const useMainCountdown = () => {
  const [countdown, setCountdown] = useState(600); // Initial countdown in seconds
  const [isVoting, setIsVoting] = useState(false);
  const [formattedTime, setFormattedTime] = useState("10:00");

  useEffect(() => {
    const startTime = Date.now();

    const counter = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const newCountdown = 600 - elapsed;

      if (newCountdown <= 0) {
        clearInterval(counter);
        setIsVoting(true);
        setFormattedTime("00:00");
        return;
      }

      const minutes = Math.floor(newCountdown / 60);
      const seconds = newCountdown % 60;
      setFormattedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(counter);
  }, []);

  return { countdown, formattedTime, isVoting, setIsVoting };
};
