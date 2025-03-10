export const getFirstName = (input: string) => {
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
