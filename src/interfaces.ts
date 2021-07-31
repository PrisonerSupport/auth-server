// ---- TYPE INTERFACES ----
interface UserEntry {
    username: string,
    name?: string,
    email: string,
    hash: Buffer,
    salt: Buffer,
    iterations: number
}

interface User {
    username: string,
    name?: string,
    email: string,
    password: string
}

export { User, UserEntry }