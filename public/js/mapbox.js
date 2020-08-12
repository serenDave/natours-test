/* eslint-disable */

export const displayMap = locations => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiZGF2aXNkZXYiLCJhIjoiY2tkZm51MXo3MmlyZjJ5czg1Y3d5M2hkMyJ9.ujYxC-ZwDhSbWiRBhLY5Cg';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/davisdev/ckdfo133i0nhk1ipjowpy03s7',
        scrollZoom: false,
    });

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(location => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(location.coordinates)
            .addTo(map);

        // App popup
        new mapboxgl.Popup({ offset: 30 })
            .setLngLat(location.coordinates)
            .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
            .addTo(map);

        // Extends map bounds to include the current location
        bounds.extend(location.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};