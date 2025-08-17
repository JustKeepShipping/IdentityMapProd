/*
 * Shared TypeScript interfaces for API requests, responses and
 * database entities.  Keeping these definitions in one place makes the
 * contract between client and server explicit and reduces errors when
 * refactoring.
 */

export interface Session {
  id: string;
  code: string;
  title: string;
  facilitatorEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  displayName: string;
  isVisible: boolean;
  consentGiven: boolean;
  createdAt: string;
}

export interface CreateSessionRequest {
  title: string;
  facilitatorEmail?: string;
  expiresAt?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  code: string;
}

export interface JoinSessionRequest {
  code: string;
  displayName: string;
  isVisible?: boolean;
  consentGiven: boolean;
}

export interface JoinSessionResponse {
  participantId: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
}
