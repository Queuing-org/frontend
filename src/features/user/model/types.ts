export interface User {
  userId?: number | null;
  nickname: string;
  slug: string; //ex) "user-123abc45"
  profileImageUrl: string | null;
}

export type OnboardingPayload = {
  nickname: string;
  //   profileImageUrl?: string | null;
  //   favoriteGenres?: string[];
  //   favoriteSongTitle?: string;
};
