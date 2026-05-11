import api from './api';

export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  avatar: string | null;
}

export const getUserProfileById = (id: number) => {
  return api.get<{ data: UserProfileResponse }>(`/users/${id}`);
};

export const searchUsers = (query: string) => {
  return api.get<{ data: UserProfileResponse[] }>('/users/search', {
    params: { query }
  });
};
