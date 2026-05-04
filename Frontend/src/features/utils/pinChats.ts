const PINNED_KEY = "pinnedChats";

export const getPinnedChats = (): string[] => {
  const data = localStorage.getItem(PINNED_KEY);
  return data ? JSON.parse(data) : [];
};

export const togglePinChat = (chatId: string) => {
  const pinned = getPinnedChats();

  let updated;
  if (pinned.includes(chatId)) {
    updated = pinned.filter((id) => id !== chatId); // unpin
  } else {
    updated = [chatId, ...pinned]; // pin
  }

  localStorage.setItem(PINNED_KEY, JSON.stringify(updated));
  return updated;
};