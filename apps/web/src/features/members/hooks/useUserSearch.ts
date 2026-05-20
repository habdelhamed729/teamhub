import { useQuery } from '@tanstack/react-query';
import * as UserSearchAPI from '../api/userSearch.api';
import type { User } from '@teamhub/shared';

export const useUserSearch = (q: string) => {
  return useQuery<User[]>({
    queryKey: ['userSearch', q],
    queryFn: () => UserSearchAPI.searchUsers(q),
    enabled: Boolean(q && q.length > 0),
    staleTime: 1000 * 30,
  });
};
