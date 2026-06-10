import axios from 'axios'
import { BASE_URL } from './Api';
var TOKEN = ""

const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${TOKEN}`,
    },
});


// Function to set the token in both localStorage and the Axios instance
function setToken(newToken) {
    TOKEN = newToken;
    localStorage.setItem('adminToken', newToken);
    instance.defaults.headers['Authorization'] = `Bearer ${newToken}`;
}

// Initially check if a token exists in localStorage
const storedToken = localStorage.getItem('adminToken');
if (storedToken) {
    setToken(storedToken);
}

// Get Request
const getRequest = (path) => {
    return instance.get(path);
}

// Post Request
const postRequest = (path, data) => {
    return instance.post(path, data);
}

// Delete Request
const deleteRequest = (path, data) => {
    return instance.delete(path, { data });
}

export { getRequest, postRequest, deleteRequest, setToken }




