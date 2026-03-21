export const getPetOwned = (petOwned: string) => {
  if (petOwned === "dog") {
    return "Yes, Dogs";
  } else if (petOwned === "cat") {
    return "Yes, Cats";
  } else if (petOwned === "both") {
    return "Yes, Both";
  } else {
    return "No";
  }
};
