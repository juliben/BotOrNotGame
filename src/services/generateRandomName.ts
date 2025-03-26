import { names } from "../assets/names";

export const generateRandomName = () => {
  const randomName = names[Math.floor(Math.random() * names.length)];
  return randomName;
};
