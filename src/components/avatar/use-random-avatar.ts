import { useState } from "react";

export function useRandomAvatar() {
  const [avatarSeed, setAvatarSeed] = useState("default");

  const source = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  const randomizeAvatar = () => setAvatarSeed(Math.random().toString(36).substring(7));

  return {
    avatar: source,
    randomizeAvatar,
  };
}
