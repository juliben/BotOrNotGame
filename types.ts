export type User = {
  user_id: string;
  room_id: number;
  game_name: string;
  avatar: number;
  is_ai: boolean;
  is_ready: boolean;
  is_online: boolean;
  voted_for: string;
};

export type Message = {
  created_at: string;
  sender_id: string;
  content: string;
  room_id: number;
  game_name: string;
  avatar: number;
  is_from_server: boolean;
  is_vote: boolean;
};
