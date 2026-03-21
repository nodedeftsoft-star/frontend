"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user";
import type { User } from "@/store/user";

interface CookieUser {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    brokerageName?: string;
    brokeragePhoneNumber?: string;
    website?: string;
    phoneNumber?: string;
    createdAt?: string;
}

export default function UserStoreInitializer({ user }: { user: CookieUser | null }) {
    const { setUser, user: existingUser } = useUserStore();

    useEffect(() => {
        if (user) {
            const normalizedUser: User = {
                id: user.id || existingUser?.id || "",
                firstname: user.firstName ?? existingUser?.firstname ?? "",
                lastname: user.lastName ?? existingUser?.lastname ?? "",
                username: user.username ?? existingUser?.username ?? "",
                email: user.email ?? existingUser?.email ?? "",
                brokerageName: user.brokerageName ?? existingUser?.brokerageName ?? "",
                brokeragePhoneNumber: user.brokeragePhoneNumber ?? existingUser?.brokeragePhoneNumber ?? "",
                website: user.website ?? existingUser?.website ?? "",
                phoneNumber: user.phoneNumber ?? existingUser?.phoneNumber ?? "",
                createdAt: user.createdAt ?? existingUser?.createdAt ?? "",
            };

            setUser(normalizedUser);
        }
    }, []);

    return null;
}
