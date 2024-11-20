'use strict';

// Common functionality for all pages
document.addEventListener('DOMContentLoaded', () => {
    const findBunkerButton = document.getElementById('find-bunker');
    const homePageButtons = document.querySelectorAll ('.home-button');

    //Add click event listener to navigate to index.html for all "home-button" elements
    homePageButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'index.html'; //Navigate to index.html
        });
    });
    
    
    // Add click event listener to navigate to map.html
    if (findBunkerButton) {
        findBunkerButton.addEventListener('click', () => {
            window.location.href = 'map.html'; // Navigate to the map page
        });
    }


    // If on the map page, initialize the map
    if (window.location.pathname === '/map.html') {
        initializeMap();
    }
});

// Function to initialize the map on the map page
function initializeMap() {
    // Create a map object
    const map = L.map('map').setView([59.9139, 10.7522], 6); // Center map on Oslo

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch bunker data from the dataset folder
    fetch('dataset/shelters.json')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched Bunker Data:', data);

            // Extract the features array from the JSON
            const features = data.features;

            // Iterate over each feature and add a marker
            features.forEach(feature => {
                const coordinates = feature.geometry.coordinates;
                const properties = feature.properties;

                if (coordinates && coordinates.length === 2) {
                    const [lon, lat] = coordinates; // GeoJSON uses [longitude, latitude]

                    // Add marker for each bunker
                    L.marker([lat, lon])
                        .addTo(map)
                        .bindPopup(`
                            <b>Bunker Address:</b> ${properties.adresse || 'Unknown'}<br>
                            <b>Municipality:</b> ${properties.kommune || 'Unknown'}<br>
                            <b>Capacity:</b> ${properties.plasser || 'Unknown'} people
                        `);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching bunker data:', error);
        });
}
