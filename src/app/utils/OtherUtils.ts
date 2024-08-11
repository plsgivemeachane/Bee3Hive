function usernameIsValid(username: string) { return /^[0-9a-zA-Z_.-]+$/.test(username); }

export { usernameIsValid }