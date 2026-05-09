// Legacy re-export — all pages already import { api } from '../api.js'
// This file now delegates to the new /api/* client so no page-level imports need to change.
export { api } from './api/client.js'
