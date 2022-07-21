import { encode, decode, TAlgorithm } from "jwt-simple";

const algorithm: TAlgorithm = "HS512"; // Always use HS512 to sign the token
const expirationDelay: number = 15 * 60 * 1000; // 15 mins in milliseconds
const SECRET_KEY: string = process.env.AUTH_SECRET_KEY ?? "secret-key_secret-key_secret-key_secret-key_secret-key_secret-key_secret-key";

interface Session {
    userId: number,
    issued: number, // in Unix milliseconds
    expires: number // in Unix milliseconds
}

type DecodeResult = {valid: true, userId: number} | {valid: false};

function encodeUserId(userId: number): string {
    const issued = Date.now();
    const expires = issued + expirationDelay;

    const session: Session = {
        userId: userId,
        issued: issued,
        expires: expires
    };

    return encode(session, SECRET_KEY, algorithm);
}

function checkExpiration(session: Session) {
    return session.expires > Date.now();
}

function decodeToken(token: string): DecodeResult {
    try {
        const session: Session = decode(token, SECRET_KEY, false, algorithm);
        const valid: boolean = checkExpiration(session);
        return {valid: valid, userId: session.userId};
    } catch (_e) {
        return {valid: false};
    }
}

export default { encodeUserId, decodeToken };
