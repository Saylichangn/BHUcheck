import { hash, verify } from "@node-rs/argon2";

const argonOptions = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Used to keep the verify step in the same cost range when the email is unknown.
const placeholderHash =
  "$argon2id$v=19$m=19456,t=2,p=1$9lIyN5o1dm13K4ECtEeubQ$xKDmHYsEIlzLBC0p2wPWR/g7D0HgcpRezyDAps7qSiA";

export function hashPassword(password: string) {
  return hash(password, argonOptions);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

export function verifyPlaceholder(password: string) {
  return verify(placeholderHash, password);
}
