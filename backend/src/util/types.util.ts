export interface UserDataFrontend {
    u_userId: string,
    u_firstname: string,
    u_lastname: string,
    u_email: string,
    u_createdAt: string,
    roles: number[]
}

export interface UserDataAdminView {
    u_userId: string
    u_firstname: string,
    u_lastname: string,
    u_email: string,
    u_createdAt: string,
    u_deletedAt?: string
}