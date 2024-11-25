export function validateEmail(email: string): string | undefined {

    if (!email) return "Invalid email";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return "Invalid email format";
    }
    return undefined;
}

export function validatePassword(password: string): string | undefined {
    if (!password) return "Invalid password"

    /* Password validation disabled for testing

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%&*+_\-]{8,}$/;

    if (!passwordRegex.test(password)) {
        return "Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, and one digit. Only @#$%&*_+- special characters are allowed.";
    }

    */

    return undefined;
}

export function validateName(name: string): string | undefined {
    const nameRegex = /^[\p{L}\s]{2,}$/u;

    if (!nameRegex.test(name)) {
        return "Invalid name";
    }

    return undefined;
}