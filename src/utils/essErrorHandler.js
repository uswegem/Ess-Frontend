// utils/essErrorHandler.js
export const getESSErrorMessage = (responseCode, description) => {
    const errorMap = {
        '8000': 'Success',
        '8001': 'Required header is not given',
        '8002': 'Unauthorized',
        '8003': 'No FSP communication details', // Your current error
        '8004': 'Service provider is not active',
        '8005': 'General Failure',
        '8006': 'Duplicate Request/ Already received',
        '8007': 'Invalid bank account',
        '8008': 'Bank account not active',
        '8009': 'Invalid Signature',
        '8010': 'Invalid Signature Configuration',
        '8011': 'Error on processing request',
        '8012': 'Request cannot be completed at this time, try later',
        '8013': 'Inactive communication protocol',
        '8014': 'Invalid code, mismatch of supplied code on information and header',
        '8015': 'Invalid deduction code',
        '8016': 'Check Number does not exist',
        '8017': 'Vote code does not exist',
        '8018': 'Invalid product code',
        '8019': 'Invalid Application number',
        '8020': 'Payment reference number does not exist'
    };
    
    return errorMap[responseCode] || description;
};

export const isESSSuccess = (responseCode) => {
    return responseCode === '8000';
};