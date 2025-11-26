/**
 * Main Application Module
 * Coordinates all app functionality
 */

const App = {
    // Initialize app
    init: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // Device ready handler
    onDeviceReady: function() {
        console.log('Device ready');

        // Hide splash screen
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
        }, 1500);

        // Initialize authentication
        const isAuthenticated = Auth.init();

        if (isAuthenticated) {
            this.showHomePage();
        } else {
            this.showLoginPage();
        }

        // Setup event listeners
        this.setupEventListeners();

        // Initialize push notifications
        this.initPushNotifications();

        // Handle back button
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);
    },

    // Setup all event listeners
    setupEventListeners: function() {
        // Menu
        document.getElementById('menu-btn').addEventListener('click', this.toggleMenu.bind(this));
        document.getElementById('close-menu-btn').addEventListener('click', this.toggleMenu.bind(this));

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
        document.getElementById('logout-btn').addEventListener('click', this.handleLogout.bind(this));

        // Login form
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));

        // Add incident button
        document.getElementById('add-incident-btn').addEventListener('click', this.showAddIncidentModal.bind(this));

        // Add incident form
        document.getElementById('add-incident-form').addEventListener('submit', this.handleAddIncident.bind(this));

        // Modal close buttons
        document.getElementById('close-modal-btn').addEventListener('click', this.hideAddIncidentModal.bind(this));
        document.getElementById('cancel-incident-btn').addEventListener('click', this.hideAddIncidentModal.bind(this));
        document.getElementById('close-detail-btn').addEventListener('click', this.hideIncidentDetail.bind(this));

        // Photo buttons
        document.getElementById('take-photo-btn').addEventListener('click', this.handleTakePhoto.bind(this));
        document.getElementById('choose-photo-btn').addEventListener('click', this.handleChoosePhoto.bind(this));

        // Location button
        document.getElementById('get-location-btn').addEventListener('click', this.handleGetLocation.bind(this));

        // Filter and refresh
        document.getElementById('category-filter').addEventListener('change', this.handleCategoryFilter.bind(this));
        document.getElementById('refresh-btn').addEventListener('click', this.handleRefresh.bind(this));

        // Load more
        document.getElementById('load-more-btn').addEventListener('click', this.handleLoadMore.bind(this));

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });
    },

    // Toggle side menu
    toggleMenu: function() {
        const menu = document.getElementById('side-menu');
        menu.classList.toggle('open');
    },

    // Navigate to page
    navigateTo: function(pageName) {
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
        document.getElementById('login-page').classList.add('active');
        document.getElementById('add-incident-btn').style.display = 'none';
    },

    // Show home page
    showHomePage: function() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('add-incident-btn').style.display = 'block';
        this.navigateTo('home');
    },

    // Handle login
    handleLogin: async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        this.showLoading();

        const result = await Auth.login(username, password);

        this.hideLoading();

        if (result.success) {
            this.showHomePage();
        } else {
            this.showAlert('Login Failed', result.message || 'Invalid credentials');
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
        const listContainer = document.getElementById('incidents-list');
        
        if (page === 1) {
            listContainer.innerHTML = '<p class="text-center">Loading incidents...</p>';
        }

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
    },

    // Load categories
    loadCategories: async function() {
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
        const result = await Incidents.fetchMyIncidents();
        
        if (result.success) {
            document.getElementById('total-reports').textContent = result.data.length;
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

        const result = await Incidents.createIncident(incidentData);

        this.hideLoading();

        if (result.success) {
            this.hideAddIncidentModal();
            this.showAlert('Success', 'Incident reported successfully');
            this.loadIncidents(); // Refresh list
        } else {
            this.showAlert('Error', result.message || 'Failed to submit incident');
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
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(`${title}\n${message}`);
        }
    },

    // Initialize push notifications
    initPushNotifications: function() {
        if (window.PushNotification) {
            const push = PushNotification.init({
                android: 