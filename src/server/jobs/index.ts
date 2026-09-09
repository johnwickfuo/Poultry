export type JobHandler<TPayload = unknown> = (payload: TPayload) => Promise<void>;

// Job handlers live here; a Redis-backed queue can be attached when needed.
