// Per-customer-account order rate limit, shared by the website checkout and the mobile app so one
// account can't double its budget by switching clients. 20 orders / 10 min is far above any real
// diner's behaviour, but stops a scripted account from flooding a cafe's order queue.
export const CUSTOMER_ORDER_LIMIT = 20;
export const CUSTOMER_ORDER_WINDOW_MS = 10 * 60 * 1000;
