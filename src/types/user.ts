// Defines the available roles within the application
export type Role = 'admin' | 'user';

// Represents a user account
export interface User {
  id: string;
  username: string;
  password: string; // NOTE: In a real application, passwords should be securely hashed.
  role: Role;
}
