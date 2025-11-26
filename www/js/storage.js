/**
 * Storage Module
 * Handles local storage operations
 */

const Storage = {
    // Save data to localStorage
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    // Get data from localStorage
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    // Remove data from localStorage
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // Clear all localStorage
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    // User-specific storage
    saveUser: function(userData) {
        return this.save('user', userData);
    },

    getUser: function() {
        return this.get('user');
    },

    removeUser: function() {
        return this.remove('user');
    },

    // Token storage
    saveToken: function(token) {
        return this.save('auth_token', token);
    },

    getToken: function() {
        return this.get('auth_token');
    },

    removeToken: function() {
        return this.remove('auth_token');
    },

    // Settings storage
    saveSettings: function(settings) {
        return this.save('settings', settings);
    },

    getSettings: function() {
        return this.get('settings') || {
            notifications: true,
            autoRefresh: true
        };
    },

    // Cache incidents temporarily
    cacheIncidents: function(incidents) {
        return this.save('cached_incidents', {
            data: incidents,
            timestamp: Date.now()
        });
    },

    getCachedIncidents: function(maxAge = 300000) { // 5 minutes default
        const cached = this.get('cached_incidents');
        if (cached && (Date.now() - cached.timestamp) < maxAge) {
            return cached.data;
        }
        return null;
    }
};