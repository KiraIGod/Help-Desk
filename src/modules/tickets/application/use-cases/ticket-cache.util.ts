import { TICKET_ITEM_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';

export const ticketCacheKey = (id: string): string => `${TICKET_ITEM_KEY_PREFIX}:${id}`;
