/**
 * Incidents Module
 * Handles incident operations and API calls
 */

const Incidents = {
    currentPage: 1,
    totalPages: 1,
    currentCategory: '',
    allIncidents: [],

    // Fetch all incidents
    fetchIncidents: async function(page = 1, category = '') {
        try {
            let url = `${API_BASE_URL}/citizen-report/v1/incidents?page=${page}&per_page=10`;
            
            if (category) {
                url += `&category=${category}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch incidents');
            }

            const data = await response.json();
            this.allIncidents = data.incidents;
            this.totalPages = data.pages;
            this.currentPage = page;

            // Cache for offline access
            Storage.cacheIncidents(data.incidents);

            return { success: true, data: data.incidents, pages: data.pages };
        } catch (error) {
            console.error('Fetch incidents error:', error);
            
            // Try to use cached data
            const cached = Storage.getCachedIncidents();
            if (cached) {
                return { success: true, data: cached, cached: true };
            }

            return { success: false, message: 'Failed to load incidents' };
        }
    },

    // Fetch user's incidents
    fetchMyIncidents: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/citizen-report/v1/my-incidents`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user incidents');
            }

            const data = await response.json();
            return { success: true, data: data.incidents };
        } catch (error) {
            console.error('Fetch my incidents error:', error);
            return { success: false, message: 'Failed to load your incidents' };
        }
    },

    // Create new incident
    createIncident: async function(incidentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/citizen-report/v1/incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeaders()
                },
                body: JSON.stringify(incidentData)
            });

            if (!response.ok) {
                throw new Error('Failed to create incident');
            }

            const data = await response.json();
            
            // Notify other users (if push notifications are set up)
            this.notifyNewIncident(incidentData.title);

            return { success: true, data: data };
        } catch (error) {
            console.error('Create incident error:', error);
            return { success: false, message: 'Failed to submit incident' };
        }
    },

    // Get geolocation
    getCurrentLocation: function() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    // Reverse geocode to get location name
    getLocationName: async function(latitude, longitude) {
        try {
            // Using OpenStreetMap Nominatim API (free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );

            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            const data = await response.json();
            return data.display_name || `${latitude}, ${longitude}`;
        } catch (error) {
            console.error('Geocoding error:', error);
            return `${latitude}, ${longitude}`;
        }
    },

    // Capture photo using camera
    capturePhoto: function() {
        return new Promise((resolve, reject) => {
            if (!navigator.camera) {
                reject(new Error('Camera not available'));
                return;
            }

            navigator.camera.getPicture(
                (imageData) => {
                    resolve('data:image/jpeg;base64,' + imageData);
                },
                (error) => {
                    reject(error);
                },
                {
                    quality: 70,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    encodingType: Camera.EncodingType.JPEG,
                    mediaType: Camera.MediaType.PICTURE,
                    correctOrientation: true,
                    saveToPhotoAlbum: false
                }
            );
        });
    },

    // Choose photo from gallery
    choosePhoto: function() {
        return new Promise((resolve, reject) => {
            if (!navigator.camera) {
                reject(new Error('Camera not available'));
                return;
            }

            navigator.camera.getPicture(
                (imageData) => {
                    resolve('data:image/jpeg;base64,' + imageData);
                },
                (error) => {
                    reject(error);
                },
                {
                    quality: 70,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    encodingType: Camera.EncodingType.JPEG,
                    mediaType: Camera.MediaType.PICTURE
                }
            );
        });
    },

    // Notify about new incident
    notifyNewIncident: async function(title) {
        try {
            await fetch(`${API_BASE_URL}/citizen-report/v1/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'New Incident Reported',
                    body: title
                })
            });
        } catch (error) {
            console.error('Notification error:', error);
        }
    },

    // Format date
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    },

    // Count incidents by category
    countByCategory: function(incidents) {
        const counts = {
            accident: 0,
            fighting: 0,
            rioting: 0,
            fire: 0,
            theft: 0,
            other: 0
        };

        incidents.forEach(incident => {
            if (incident.category && incident.category.length > 0) {
                const cat = incident.category[0].toLowerCase();
                if (counts.hasOwnProperty(cat)) {
                    counts[cat]++;
                }
            }
        });

        return counts;
    }
};