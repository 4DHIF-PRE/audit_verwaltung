import {RolesUser} from "~/types/RolesUser";

export interface UserDetails {
    u_userId: string,
    u_firstname: string,
    u_lastname: string,
    u_email: string,
    u_createdAt: string,
    roles: RolesUser[]
}