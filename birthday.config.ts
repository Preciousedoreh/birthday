/** Edit this file to personalize the complete experience. Paths in /public start with /. */
export const birthdayConfig = {
  recipientName: "Bukky",
  nickname: "my love",
  relationship: "someone very special",
  mainHeadline: ["Happy", "birthday,"], // The name is added on the final line.
  personalMessage: "You bring a very specific kind of sunshine into ordinary days. Today, the sunshine is all yours.",
  introLines: ["Some days are ordinary…", "But today is different.", "Because today, the world celebrates someone extraordinary."],
  reasons: [
    "Your smile can change the feeling of an entire day.",
    "Your kindness makes the world feel softer.",
    "Your laughter is a little piece of magic.",
    "Your strength inspires me more than you know.",
    "With you, even ordinary moments feel unforgettable.",
    "Life is more beautiful because you are in it."
  ],
  letter: {
    salutation: "My dearest Bukky,",
    paragraphs: [
      "If I could give you one thing in this world, it would be the chance to see yourself through my eyes. You would see someone extraordinary: beautiful in spirit, generous with love, and impossible to forget.",
      "Every moment with you is a gift. I treasure your smile, your heart, the way you turn small days into stories worth remembering, and the quiet comfort of simply being near you.",
      "Today is yours. I hope this new chapter brings you deep joy, gentle peace, wonderful surprises, and every dream you have been brave enough to hold close."
    ],
    signoff: "Happy Birthday, my love. Always yours. ♥"
  },
  surpriseMessage: "If I had to choose again, in every lifetime, I would still choose you. ♥",
  musicSource: "", // Optional licensed or personal audio in /public, e.g. /audio/our-song.mp3. Built-in original melody plays when empty.
  theme: { ivory: "#fff8e9", plum: "#362335", coral: "#f55b59", gold: "#ffdc72", blush: "#f8c4bb" },
  sections: { reasons: true, letter: true, fireworks: true, cake: true, gift: true }
} as const;
