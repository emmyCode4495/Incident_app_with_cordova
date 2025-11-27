/**
 * Main Application Module - FIXED VERSION
 * Coordinates all app functionality
 */

const App = {
    deviceReadyFired: false,
    
    // Initialize app
    init: function() {
        console.log('App.init called');
        this.updateSplash('Initializing app...');
        
        // Check if Cordova is available
        if (typeof cordova === 'undefined') {
            console.log('Cordova not detected, using browser mode');
            this.updateSplash('Running in browser mode');
            setTimeout(() => {
                this.onDeviceReady();
            }, 1000);
        } else {
            console.log('Cordova detected, waiting for deviceready');
            this.updateSplash('Loading Cordova...');
            
            // Set up deviceready listener
            document.addEventListener('deviceready', () => {
                console.log('deviceready event fired');
                this.deviceReadyFired = true;
                this.onDeviceReady();
            }, false);
            
            // Fallback timeout (if deviceready doesn't fire in 5 seconds)
            setTimeout(() => {
                if (!this.deviceReadyFired) {
                    console.warn('deviceready timeout, forcing launch');
                    this.updateSplash('Timeout - forcing launch...');
                    this.onDeviceReady();
                }
            }, 5000);
        }
    },

    // Update splash screen message
    updateSplash: function(message) {
        const splashMsg = document.getElementById('splash-message');
        const splashDebug = document.getElementById('splash-debug');
        if (splashMsg) {
            splashMsg.textContent = message;
        }
        if (splashDebug) {
            const timestamp = new Date().toLocaleTimeString();
            splashDebug.textContent = `[${timestamp}] ${message}`;
        }
        console.log('Splash:', message);
    },

    // Device ready handler
    onDeviceReady: function() {
        console.log('onDeviceReady called');
        this.updateSplash('Device ready!');

        // Hide splash screen after short delay
        setTimeout(() => {
            this.updateSplash('Loading interface...');
            
            try {
                document.getElementById('splash-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                console.log('App UI displayed');
                
                // Initialize authentication
                this.updateSplash('Checking authentication...');
                const isAuthenticated = Auth.init();
                console.log('Authentication check:', isAuthenticated);

                if (isAuthenticated) {
                    this.showHomePage();
                } else {
                    this.showLoginPage();
                }

                // Setup event listeners
                this.setupEventListeners();

                // Initialize push notifications (if available)
                if (typeof PushNotification !== 'undefined') {
                    this.initPushNotifications();
                }

                // Handle back button (if available)
                if (typeof cordova !== 'undefined') {
                    document.addEventListener('backbutton', this.onBackButton.bind(this), false);
                }
                
                console.log('App fully initialized');
            } catch (error) {
                console.error('Error during initialization:', error);
                alert('Error initializing app: ' + error.message);
            }
        }, 1000);
    },

    // Setup all event listeners
    setupEventListeners: function() {
        console.log('Setting up event listeners');
        
        try {
            // Menu
            this.addListener('menu-btn', 'click', this.toggleMenu.bind(this));
            this.addListener('close-menu-btn', 'click', this.toggleMenu.bind(this));

            // Menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.target.getAttribute('data-page');
                    if (page) {
                        this.navigateTo(page);
                        this.toggleMenu();
                    }
                });
            });

            // Logout
            this.addListener('logout-btn', 'click', this.handleLogout.bind(this));

            // Login form
            this.addListener('login-form', 'submit', this.handleLogin.bind(this));

            // Add incident button
            this.addListener('add-incident-btn', 'click', this.showAddIncidentModal.bind(this));

            // Add incident form
            this.addListener('add-incident-form', 'submit', this.handleAddIncident.bind(this));

            // Modal close buttons
            this.addListener('close-modal-btn', 'click', this.hideAddIncidentModal.bind(this));
            this.addListener('cancel-incident-btn', 'click', this.hideAddIncidentModal.bind(this));
            this.addListener('close-detail-btn', 'click', this.hideIncidentDetail.bind(this));

            // Photo buttons
            this.addListener('take-photo-btn', 'click', this.handleTakePhoto.bind(this));
            this.addListener('choose-photo-btn', 'click', this.handleChoosePhoto.bind(this));

            // Location button
            this.addListener('get-location-btn', 'click', this.handleGetLocation.bind(this));

            // Filter and refresh
            this.addListener('category-filter', 'change', this.handleCategoryFilter.bind(this));
            this.addListener('refresh-btn', 'click', this.handleRefresh.bind(this));

            // Load more
            this.addListener('load-more-btn', 'click', this.handleLoadMore.bind(this));

            // Category cards
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const category = e.currentTarget.getAttribute('data-category');
                    this.filterByCategory(category);
                });
            });
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    },
    
    // Helper to safely add event listener
    addListener: function(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn('Element not found:', id);
        }
    },

    // Toggle side menu
    toggleMenu: function() {
        const menu = document.getElementById('side-menu');
        menu.classList.toggle('open');
    },

    // Navigate to page
    navigateTo: function(pageName) {
        console.log('Navigating to:', pageName);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Update menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected page
        const page = document.getElementById(`${pageName}-page`);
        if (page) {
            page.classList.add('active');
            
            // Update active menu item
            const menuItem = document.querySelector(`[data-page="${pageName}"]`);
            if (menuItem) {
                menuItem.classList.add('active');
            }

            // Update page title
            this.updatePageTitle(pageName);

            // Load page data
            this.loadPageData(pageName);
        }
    },

    // Update page title
    updatePageTitle: function(pageName) {
        const titles = {
            'home': 'All Incidents',
            'my-incidents': 'My Reports',
            'categories': 'Categories',
            'profile': 'Profile'
        };

        document.getElementById('page-title').textContent = titles[pageName] || 'Citizen Report';
    },

    // Load page specific data
    loadPageData: function(pageName) {
        console.log('Loading page data for:', pageName);
        
        switch(pageName) {
            case 'home':
                this.loadIncidents();
                break;
            case 'my-incidents':
                this.loadMyIncidents();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    },

    // Show login page
    showLoginPage: function() {
        console.log('Showing login page');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('add-incident-btn').style.display = 'none';
    },

    // Show home page
    showHomePage: function() {
        console.log('Showing home page');
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('add-incident-btn').style.display = 'block';
        this.navigateTo('home');
    },

    // Handle login
    handleLogin: async function(e) {
        e.preventDefault();
        console.log('Login attempt');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showAlert('Error', 'Please enter username and password');
            return;
        }

        this.showLoading();

        try {
            const result = await Auth.login(username, password);
            this.hideLoading();

            if (result.success) {
                console.log('Login successful');
                this.showHomePage();
            } else {
                console.log('Login failed:', result.message);
                this.showAlert('Login Failed', result.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.hideLoading();
            this.showAlert('Error', 'Login failed: ' + error.message);
        }
    },

    // Handle logout
    handleLogout: function() {
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
            this.showLoginPage();
            this.toggleMenu();
        }
    },

    // Load incidents
    loadIncidents: async function(page = 1) {
        console.log('Loading incidents, page:', page);
        const listContainer = document.getElementById('incidents-list');
        
        if (page === 1) {
            listContainer.innerHTML = '<p class="text-center">Loading incidents...</p>';
        }

        try {
            const result = await Incidents.fetchIncidents(page, Incidents.currentCategory);

            if (result.success) {
                if (page === 1) {
                    this.renderIncidents(result.data);
                } else {
                    this.appendIncidents(result.data);
                }

                // Show/hide load more button
                const loadMoreBtn = document.getElementById('load-more-btn');
                if (Incidents.currentPage >= Incidents.totalPages) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }

                if (result.cached) {
                    this.showAlert('Offline Mode', 'Showing cached incidents');
                }
            } else {
                listContainer.innerHTML = '<p class="text-center">Failed to load incidents. Please try again.</p>';
            }
        } catch (error) {
            console.error('Error loading incidents:', error);
            listContainer.innerHTML = '<p class="text-center">Error loading incidents: ' + error.message + '</p>';
        }
    },

    // Render incidents
    renderIncidents: function(incidents) {
        const listContainer = document.getElementById('incidents-list');

        if (incidents.length === 0) {
            listContainer.innerHTML = '<p class="text-center">No incidents found</p>';
            return;
        }

        listContainer.innerHTML = incidents.map(incident => this.createIncidentCard(incident)).join('');

        // Add click listeners
        document.querySelectorAll('.incident-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                this.showIncidentDetail(incidents.find(i => i.id == id));
            });
        });
    },

    // Append incidents
    appendIncidents: function(incidents) {
        const listContainer = document.getElementById('incidents-list');
        const html = incidents.map(incident => this.createIncidentCard(incident)).join('');
        listContainer.insertAdjacentHTML('beforeend', html);

        // Add click listeners to new cards
        document.querySelectorAll('.incident-card').forEach(card => {
            if (!card.hasAttribute('data-listener')) {
                card.setAttribute('data-listener', 'true');
                card.addEventListener('click', () => {
                    const id = card.getAttribute('data-id');
                    this.showIncidentDetail(incidents.find(i => i.id == id));
                });
            }
        });
    },

    // Create incident card HTML
    createIncidentCard: function(incident) {
        const categoryName = incident.category && incident.category.length > 0 ? incident.category[0] : 'Other';
        const imageHtml = incident.image ? `<img src="${incident.image}" class="incident-image" alt="Incident">` : '';
        
        return `
            <div class="incident-card" data-id="${incident.id}">
                <div class="incident-header">
                    <h3 class="incident-title">${incident.title}</h3>
                    <span class="incident-category">${categoryName}</span>
                </div>
                ${imageHtml}
                <p class="incident-description">${incident.content.substring(0, 100)}${incident.content.length > 100 ? '...' : ''}</p>
                <div class="incident-meta">
                    <span>📅 ${Incidents.formatDate(incident.date)}</span>
                    <span>👤 ${incident.author}</span>
                    ${incident.location_name ? `<span>📍 ${incident.location_name.substring(0, 30)}...</span>` : ''}
                </div>
            </div>
        `;
    },

    // Show incident detail
    showIncidentDetail: function(incident) {
        const modal = document.getElementById('incident-detail-modal');
        const content = document.getElementById('incident-detail-content');

        const categoryName = incident.category && incident.category.length > 0 ? incident.category[0] : 'Other';
        const imageHtml = incident.image ? `<img src="${incident.image}" class="incident-image" alt="Incident">` : '';
        const locationHtml = incident.latitude && incident.longitude ? 
            `<p><strong>📍 Location:</strong> ${incident.location_name || `${incident.latitude}, ${incident.longitude}`}</p>
             <p><a href="https://www.google.com/maps?q=${incident.latitude},${incident.longitude}" target="_blank" class="btn btn-secondary btn-sm">View on Map</a></p>` : '';

        content.innerHTML = `
            <div style="padding: 20px;">
                <div class="incident-header" style="margin-bottom: 15px;">
                    <h3 class="incident-title">${incident.title}</h3>
                    <span class="incident-category">${categoryName}</span>
                </div>
                ${imageHtml}
                <p style="margin: 15px 0;"><strong>Description:</strong></p>
                <p style="line-height: 1.6; color: #666;">${incident.content}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><strong>👤 Reported by:</strong> ${incident.author}</p>
                <p><strong>📅 Date:</strong> ${new Date(incident.date).toLocaleString()}</p>
                ${locationHtml}
            </div>
        `;

        modal.classList.add('active');
    },

    // Hide incident detail
    hideIncidentDetail: function() {
        document.getElementById('incident-detail-modal').classList.remove('active');
    },

    // Load my incidents
    loadMyIncidents: async function() {
        const listContainer = document.getElementById('my-incidents-list');
        listContainer.innerHTML = '<p class="text-center">Loading your incidents...</p>';

        try {
            const result = await Incidents.fetchMyIncidents();

            if (result.success) {
                if (result.data.length === 0) {
                    listContainer.innerHTML = '<p class="text-center">You haven\'t submitted any incidents yet</p>';
                } else {
                    listContainer.innerHTML = result.data.map(incident => this.createIncidentCard(incident)).join('');

                    // Add click listeners
                    document.querySelectorAll('#my-incidents-list .incident-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const id = card.getAttribute('data-id');
                            this.showIncidentDetail(result.data.find(i => i.id == id));
                        });
                    });
                }
            } else {
                listContainer.innerHTML = '<p class="text-center">Failed to load your incidents</p>';
            }
        } catch (error) {
            console.error('Error loading my incidents:', error);
            listContainer.innerHTML = '<p class="text-center">Error: ' + error.message + '</p>';
        }
    },

    // Load categories
    loadCategories: async function() {
        try {
            const result = await Incidents.fetchIncidents(1, '');
            
            if (result.success) {
                const counts = Incidents.countByCategory(result.data);
                
                Object.keys(counts).forEach(category => {
                    const countEl = document.getElementById(`count-${category}`);
                    if (countEl) {
                        countEl.textContent = `${counts[category]} report${counts[category] !== 1 ? 's' : ''}`;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    },

    // Load profile
    loadProfile: function() {
        const user = Auth.getCurrentUser();
        
        if (user) {
            document.getElementById('profile-name').textContent = user.displayName || user.username;
            document.getElementById('profile-email').textContent = user.email || '';
        }

        // Load user stats
        this.loadUserStats();
    },

    // Load user statistics
    loadUserStats: async function() {
        try {
            const result = await Incidents.fetchMyIncidents();
            
            if (result.success) {
                document.getElementById('total-reports').textContent = result.data.length;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    // Show add incident modal
    showAddIncidentModal: function() {
        document.getElementById('add-incident-modal').classList.add('active');
        this.handleGetLocation(); // Auto-get location
    },

    // Hide add incident modal
    hideAddIncidentModal: function() {
        document.getElementById('add-incident-modal').classList.remove('active');
        document.getElementById('add-incident-form').reset();
        document.getElementById('photo-preview').innerHTML = '';
        document.getElementById('incident-image').value = '';
    },

    // Handle get location
    handleGetLocation: async function() {
        const locationText = document.getElementById('current-location');
        locationText.textContent = '📍 Getting location...';

        try {
            const location = await Incidents.getCurrentLocation();
            const locationName = await Incidents.getLocationName(location.latitude, location.longitude);

            document.getElementById('incident-latitude').value = location.latitude;
            document.getElementById('incident-longitude').value = location.longitude;
            document.getElementById('incident-location-name').value = locationName;

            locationText.textContent = `📍 ${locationName.substring(0, 50)}...`;
        } catch (error) {
            console.error('Location error:', error);
            locationText.textContent = '📍 Location unavailable';
            this.showAlert('Location Error', 'Could not get your location');
        }
    },

    // Handle take photo
    handleTakePhoto: async function() {
        try {
            this.showLoading();
            const imageData = await Incidents.capturePhoto();
            this.hideLoading();

            document.getElementById('incident-image').value = imageData;
            document.getElementById('photo-preview').innerHTML = `<img src="${imageData}" alt="Preview">`;
        } catch (error) {
            this.hideLoading();
            console.error('Camera error:', error);
            this.showAlert('Camera Error', 'Could not access camera');
        }
    },

    // Handle choose photo
    handleChoosePhoto: async function() {
        try {
            this.showLoading();
            const imageData = await Incidents.choosePhoto();
            this.hideLoading();

            document.getElementById('incident-image').value = imageData;
            document.getElementById('photo-preview').innerHTML = `<img src="${imageData}" alt="Preview">`;
        } catch (error) {
            this.hideLoading();
            console.error('Gallery error:', error);
            this.showAlert('Gallery Error', 'Could not access gallery');
        }
    },

    // Handle add incident
    handleAddIncident: async function(e) {
        e.preventDefault();

        const incidentData = {
            title: document.getElementById('incident-title').value,
            category: document.getElementById('incident-category').value,
            description: document.getElementById('incident-description').value,
            latitude: document.getElementById('incident-latitude').value,
            longitude: document.getElementById('incident-longitude').value,
            location_name: document.getElementById('incident-location-name').value,
            image: document.getElementById('incident-image').value
        };

        this.showLoading();

        try {
            const result = await Incidents.createIncident(incidentData);
            this.hideLoading();

            if (result.success) {
                this.hideAddIncidentModal();
                this.showAlert('Success', 'Incident reported successfully');
                this.loadIncidents(); // Refresh list
            } else {
                this.showAlert('Error', result.message || 'Failed to submit incident');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Submit error:', error);
            this.showAlert('Error', 'Failed to submit: ' + error.message);
        }
    },

    // Handle category filter
    handleCategoryFilter: function(e) {
        Incidents.currentCategory = e.target.value;
        this.loadIncidents();
    },

    // Handle refresh
    handleRefresh: function() {
        this.loadIncidents();
    },

    // Handle load more
    handleLoadMore: function() {
        this.loadIncidents(Incidents.currentPage + 1);
    },

    // Filter by category
    filterByCategory: function(category) {
        document.getElementById('category-filter').value = category;
        Incidents.currentCategory = category;
        this.navigateTo('home');
        this.loadIncidents();
    },

    // Show loading overlay
    showLoading: function() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    // Hide loading overlay
    hideLoading: function() {
        document.getElementById('loading-overlay').style.display = 'none';
    },

    // Show alert
    showAlert: function(title, message) {
        if (typeof navigator !== 'undefined' && navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(`${title}\n\n${message}`);
        }
    },

    // Initialize push notifications
    initPushNotifications: function() {
        if (typeof PushNotification === 'undefined') {
            console.log('Push notifications not available');
            return;
        }

        try {
            const push = PushNotification.init({
                android: {
                    icon: 'notification',
                    sound: true,
                    vibrate: true
                },
                ios: {
                    alert: true,
                    badge: true,
                    sound: true
                }
            });

            push.on('registration', (data) => {
                console.log('Push registration ID:', data.registrationId);
                Storage.save('push_token', data.registrationId);
            });

            push.on('notification', (data) => {
                console.log('Notification received:', data);
                this.showAlert(data.title, data.message);
                this.loadIncidents();
            });

            push.on('error', (e) => {
                console.error('Push error:', e);
            });
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    },

    // Handle back button
    onBackButton: function(e) {
        e.preventDefault();

        const addModal = document.getElementById('add-incident-modal');
        const detailModal = document.getElementById('incident-detail-modal');
        const menu = document.getElementById('side-menu');

        if (addModal.classList.contains('active')) {
            this.hideAddIncidentModal();
        } else if (detailModal.classList.contains('active')) {
            this.hideIncidentDetail();
        } else if (menu.classList.contains('open')) {
            this.toggleMenu();
        } else if (typeof navigator !== 'undefined' && navigator.app) {
            navigator.app.exitApp();
        }
    }
};

// Initialize app when script loads
console.log('App script loaded, calling App.init()');
App.init();