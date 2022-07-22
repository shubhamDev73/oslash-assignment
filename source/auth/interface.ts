export interface NewUser {
    username: string,
    password: string
}

export interface User extends NewUser {
    id: number
}

export interface Session {
    userId: number,
    issued: number, // in Unix milliseconds
    expires: number // in Unix milliseconds
}

export type DecodeResult = {valid: true, session: Session} | {valid: false};
