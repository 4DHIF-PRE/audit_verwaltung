import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

export interface HashResult {
    error?: Error,
    salt?: string,
    hash?: string
}

const scryptPromise: (key: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer> = promisify(scrypt);
const hashLengthInBytes: number = 32; // the length of the hashes in bytes (hex representation is (lengthInBytes * 2) characters long)
const saltLengthInBytes: number = 32;

/**
 * @returns {HashResult} the salt and the hash or an error
 */
export async function HashWithSalt(password: string): Promise<HashResult> {
    if (!password) {
        return { error: new Error("Password must not be empty"), salt: null, hash: null };
    }

    try {
        const salt = randomBytes(saltLengthInBytes).toString('hex');
        const hashedPassword: Buffer = await scryptPromise(Buffer.from(password, 'utf-8'), salt, hashLengthInBytes);
        return { error: null, salt: salt, hash: hashedPassword.toString('hex') };
    } catch (error) {
        return { error: error, salt: null, hash: null };
    }
}


/**
 * @param {string} passwordInput password to be hashed and compared to the other hash
 * @param {string} salt the salt which was used to hash the hash being compared to 
 * @param {string} hash the hash being compared to 
 * @returns {boolean} true if they match, otherwise false
 */
export async function ComparePasswords(passwordInput: string, salt: string, hash: string): Promise<boolean> {
    const hashedPasswordInput: string = (await scryptPromise(Buffer.from(passwordInput, 'utf-8'), salt, hashLengthInBytes)).toString('hex');

    return hashedPasswordInput === hash;
}


/**
 * @returns a 64 characters long random string
 */
export function GenerateSessionId(): string {
    return randomBytes(32).toString('hex');
}


/**
 * @returns a 64 characters long userId
 */
export async function GenerateUserId(): Promise<string> {
    const now = new Date();
    const utcTime = now.toUTCString();
    const salt = randomBytes(16);
    const userId: Buffer = await scryptPromise(Buffer.from(utcTime, 'utf-8'), salt, 32);

    return userId.toString('hex');
}