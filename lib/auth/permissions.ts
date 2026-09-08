// auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access"

// Resources + actions available across your app
const statement = {
    ...defaultStatements, // keeps the built-in "user"/"session" resources
    project: ["create", "share", "update", "delete"],
} as const

export const ac = createAccessControl(statement)

export const recruiter = ac.newRole({
})

export const candidate = ac.newRole({
})

export const admin = ac.newRole({
    project: ["create", "update", "delete"],
    ...adminAc.statements, // keep the default admin's full user/session control
})
