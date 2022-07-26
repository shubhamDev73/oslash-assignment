import { encode, decode, TAlgorithm } from "jwt-simple";
import { checkToken } from "./dao";
import { DecodeResult, Session } from "./interface";

const algorithm: TAlgorithm = "HS512"; // Always use HS512 to sign the token
const expirtaionTime = process.env.NODE_ENV == 'test' ? 10 : 15 * 60 // 10 sec for tests, 15 mins else
const expirationDelay: number = expirtaionTime * 1000; // in milliseconds
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

const decodeToken = (token: string) => new Promise<DecodeResult>((resolve, reject) => {
    try {
        const session: Session = decode(token, SECRET_KEY, false, algorithm);
        checkToken(token, session)
        .then((valid: boolean) => resolve({valid: valid, session: session}))
    } catch (_e) { reject(); }
});

export default { encodeUserId, decodeToken };
