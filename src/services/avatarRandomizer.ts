export const avatarRandomizer = () => {
  const random = Math.floor(Math.random() * 76) + 1;
  const number = String(random).padStart(2, "0");
  return number;
};
