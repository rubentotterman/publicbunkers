'use strict';

// Common functionality for all pages
document.addEventListener('DOMContentLoaded', () => {
    const findBunkerButton = document.getElementById('find-bunker');
    const homePageButtons = document.querySelectorAll('.home-button');
    const findClosestButton = document.getElementById('find-closest-bunker');

    // Add click event listener to navigate to index.html for all "home-button" elements
    homePageButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'index.html'; // Navigate to index.html
        });
    });

    // Add click event listener to navigate to map.html
    if (findBunkerButton) {
        findBunkerButton.addEventListener('click', () => {
            window.location.href = 'map.html'; // Navigate to the map page
        });
    }

    // Add click event listener for "find-closest-bunker"
    if (findClosestButton) {
        findClosestButton.addEventListener('click', () => {
            findClosestBunker();
        });
    }

    // If on the map page, initialize the map
    if (window.location.pathname === '/map.html') {
        initializeMap();
    }
});

// Function to find and show the closest bunker
function findClosestBunker() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Redirect to map.html with user's location in query parameters
            window.location.href = `map.html?lat=${userLat}&lon=${userLon}`;
        },
        (error) => {
            alert('Unable to retrieve your location. Please allow location access and try again.');
        }
    );
}

// Function to initialize the map on the map page
function initializeMap() {
    const map = L.map('map').setView([59.9139, 10.7522], 6); // Default center on Oslo

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Get user's location from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userLat = parseFloat(urlParams.get('lat'));
    const userLon = parseFloat(urlParams.get('lon'));

    // Array to store markers
    let allMarkers = [];
    let closestBunker = null;
    let closestDistance = Infinity;

    // Fetch bunker data
    fetch('dataset/shelters.json')
        .then(response => response.json())
        .then(data => {
            const features = data.features;

            // Add markers for all bunkers
            features.forEach(feature => {
                const coordinates = feature.geometry.coordinates;
                const properties = feature.properties;

                if (coordinates && coordinates.length === 2) {
                    const [lon, lat] = coordinates; // GeoJSON uses [longitude, latitude]

                    // Calculate distance to user's location if available
                    if (!isNaN(userLat) && !isNaN(userLon)) {
                        const distance = calculateDistance(userLat, userLon, lat, lon);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestBunker = { lat, lon, properties };
                        }
                    }

                    // Create a marker
                    const marker = L.marker([lat, lon])
                        .bindPopup(`
                            <b>Bunker Address:</b> ${properties.adresse || 'Unknown'}<br>
                            <b>Municipality:</b> ${properties.kommune || 'Unknown'}<br>
                            <b>Capacity:</b> ${properties.plasser || 'Unknown'} people
                        `);
                    marker.addTo(map);

                    // Store marker
                    allMarkers.push(marker);
                }
            });

            // Highlight closest bunker
            if (closestBunker) {
                map.setView([closestBunker.lat, closestBunker.lon], 14); // Center map on closest bunker
                L.marker([closestBunker.lat, closestBunker.lon])
                    .addTo(map)
                    .bindPopup(`
                        <b>Closest Bunker</b><br>
                        <b>Bunker Address:</b> ${closestBunker.properties.adresse || 'Unknown'}<br>
                        <b>Municipality:</b> ${closestBunker.properties.kommune || 'Unknown'}<br>
                        <b>Capacity:</b> ${closestBunker.properties.plasser || 'Unknown'} people<br>
                        <b>Distance:</b> ${closestDistance.toFixed(2)} km
                    `)
                    .openPopup();
            }
        })
        .catch(error => {
            console.error('Error fetching bunker data:', error);
        });
}

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}
