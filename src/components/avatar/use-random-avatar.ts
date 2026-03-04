import { useState } from "react";

const randomSeed = () => Math.random().toString(36).substring(7);

export function useRandomAvatar() {
  const [avatarSeed, setAvatarSeed] = useState(randomSeed);

  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  const randomizeAvatar = () => setAvatarSeed(randomSeed());

  return {
    avatar,
    randomizeAvatar,
  };
}
