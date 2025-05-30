export const calculateEmojiSize = (containerWidth, emojiString) => {
  const baseSize = 40; // Base font size in pixels
  const minSize = 16; // Minimum font size
  const emojiCount = Array.from(emojiString).length;
  const spacing = 0.1; // Letter spacing in em
  
  // Calculate the total width needed at base size
  const totalWidthNeeded = baseSize * emojiCount * (1 + spacing);
  
  // If it fits, use base size
  if (totalWidthNeeded <= containerWidth) {
    return baseSize;
  }
  
  // Otherwise, scale down proportionally
  const scaledSize = Math.max(minSize, (containerWidth / emojiCount) / (1 + spacing));
  return scaledSize;
}; 