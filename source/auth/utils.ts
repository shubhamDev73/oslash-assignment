import { encode, decode, TAlgorithm } from "jwt-simple";
import { checkToken } from "./dao";
import { Session } from "./interface";

const algorithm: TAlgorithm = "HS512"; // Always use HS512 to sign the token
const expirationDelay: number = 15 * 60 * 1000; // 15 mins in milliseconds
const SECRET_KEY: string = process.env.AUTH_SECRET_KEY ?? "secret-key_secret-key_secret-key_secret-key_secret-key_secret-key_secret-key";

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

function decodeToken(token: string, callback: Function) {
    try {
        const session: Session = decode(token, SECRET_KEY, false, algorithm);
        checkToken(token, session, (valid: boolean) => {
            callback({valid: valid, session: session});
        });
    } catch (_e) {
        callback({valid: false});
    }
}

export default { encodeUserId, decodeToken };
