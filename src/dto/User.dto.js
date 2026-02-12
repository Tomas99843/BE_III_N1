export default class UserDTO {
    static getUserTokenFrom = (user) => ({
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        email: user.email,
        hasDocuments: user.documents && user.documents.length > 0
    })

    static getUserProfileFrom = (user) => ({
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        pets_count: user.pets?.length || 0,
        documents_count: user.documents?.length || 0,
        last_connection: user.last_connection,
        created_at: user.createdAt,
        updated_at: user.updatedAt
    })

    static getBasicUserInfo = (user) => ({
        id: user._id,
        full_name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
    })
}