/**
 * Authentication Module
 * Handles user authentication with WordPress
 */

// IMPORTANT: Replace with your WordPress site URL
const API_BASE_URL = 'https://your-wordpress-site.com/wp-json';

const Auth = {
    currentUser: null,
    authToken: null,

    // Initialize authentication
    init: function() {
        this.authToken = Storage.getToken();
        this.currentUser = Storage.getUser();

        if (this.authToken && this.currentUser) {
            return true;
        }
        return false;
    },

    // Login user
    login: async function(username, password) {
        try {
            // WordPress JWT Authentication or Basic Auth
            const response = await fetch(`${API_BASE_URL}/jwt-auth/v1/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                // Fallback to basic auth
                return await this.loginBasicAuth(username, password);
            }

            const data = await response.json();

            if (data.token) {
                this.authToken = data.token;
                this.currentUser = {
                    id: data.user_id,
                    username: data.user_nicename,
                    email: data.user_email,
                    displayName: data.user_display_name
                };

                Storage.saveToken(this.authToken);
                Storage.saveUser(this.currentUser);

                return { success: true, user: this.currentUser };
            }

            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    // Basic authentication fallback
    loginBasicAuth: async function(username, password) {
        try {
            const credentials = btoa(`${username}:${password}`);
            const response = await fetch(`${API_BASE_URL}/wp/v2/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const userData = await response.json();

            this.authToken = credentials;
            this.currentUser = {
                id: userData.id,
                username: userData.slug,
                email: userData.email || '',
                displayName: userData.name
            };

            Storage.saveToken(this.authToken);
            Storage.saveUser(this.currentUser);

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Basic auth error:', error);
            return { success: false, message: 'Invalid username or password' };
        }
    },

    // Logout user
    logout: function() {
        this.authToken = null;
        this.currentUser = null;
        Storage.removeToken();
        Storage.removeUser();
        Storage.clear();
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        return this.authToken !== null && this.currentUser !== null;
    },

    // Get auth headers for API requests
    getAuthHeaders: function() {
        if (!this.authToken) {
            return {};
        }

        // Check if JWT or Basic Auth
        if (this.authToken.includes('Basic')) {
            return {
                'Authorization': `Basic ${this.authToken}`
            };
        }

        return {
            'Authorization': `Bearer ${this.authToken}`
        };
    },

    // Validate token
    validateToken: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/jwt-auth/v1/token/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    },

    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    }
};