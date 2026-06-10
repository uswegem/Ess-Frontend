const BASE_URL = process.env.REACT_APP_API_V1_BASE_URL || 'http://localhost:3002/api/v1'

const API = {
    LOGIN: '/auth/login',
    CREATE_PRODUCT: '/auth/product-create',
    ALL_PRODUCTS: '/loan/list-products',
    ALL_EMPLOYEES_LOAN: '/loan/list-employee-loan',

    LOGOUT: BASE_URL + 'api/admin/admin_logout',
    ADMIN_PROFILE: BASE_URL + 'api/admin/get_admin',
    UPDATE_ADMIN: BASE_URL + 'api/admin/edit_admin',
    CHANGE_PASSWORD: BASE_URL + 'api/admin/change_password',

    //user section
    GET_ALL_USERS: BASE_URL + 'api/admin/get_all_users',
    DELETE_USER: BASE_URL + 'api/admin/delete_user',
    BLOCK_UNBLOCK_USER: BASE_URL + 'api/admin/block_unblock_user',
    GET_USER_DETAILS: BASE_URL + 'api/admin/get_user_details',

    //message response section
    PENDING_RESPONSES: '/messages/pending-responses',
    MESSAGE_REQUEST: '/messages/request',
    MANUAL_RESPONSE: '/messages/manual-response',
    MESSAGE_STATUS: '/messages/status'
}

export default API
export { BASE_URL }
