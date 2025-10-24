// web/src/styles/horrorTheme.js

export const CreepyLoadingMessages = [
  "Extracting moral fibers...",
  "Torturing your conscience...",
  "Summoning ethical dilemmas...",
  "Analyzing your soul...",
  "Preparing psychological torment...",
  "Loading existential dread...",
  "Calculating moral decay...",
  "Harvesting ethical nightmares...",
  "Initializing guilt processor...",
  "Awakening dormant demons...",
];

export const getCreepyMessage = () => {
  return CreepyLoadingMessages[Math.floor(Math.random() * CreepyLoadingMessages.length)];
};
