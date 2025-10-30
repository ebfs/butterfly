// Default radius in meters (Change here for global default)
const DEFAULT_RADIUS_METERS = 50;

(function () {

  function qs(key) {
    const u = new URL(window.location.href);
    return u.searchParams.get(key);
  }

  function toFloat(v) { return v === null ? null : parseFloat(v); }

  // Haversine distance in meters
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function getTasks() {
    try {
      const el = document.getElementById('tasks-json');
      return JSON.parse(el.textContent || '{}') || {};
    } catch(e) {
      console.error('Failed to parse tasks JSON', e);
      return {};
    }
  }

  function showStatus(msg) {
    document.getElementById('status').innerHTML = msg;
  }

  function showDistanceText(text) {
    document.getElementById('distance').textContent = text;
    document.getElementById('details').style.display = 'block';
  }

  function start() {
    const urlLat = toFloat(qs('lat'));
    const urlLng = toFloat(qs('lng'));
    const id = qs('id');

    const tasks = getTasks();
    let target = null;

    if (id && tasks[id]) { target = tasks[id]; }

    if (urlLat !== null && urlLng !== null) {
      target = Object.assign({}, target || {}, { lat: urlLat, lng: urlLng, id: id });
    }

    if (!target || target.lat === undefined || target.lng === undefined) {
      showStatus('No target coordinates found. Provide ?lat & ?lng or a valid ?id.');
      return;
    }

    const radius = (target.radius_meters !== undefined) ? Number(target.radius_meters) : DEFAULT_RADIUS_METERS;

    showStatus('Requesting your location permission…');

    const handlePosition = pos => {
      const d = haversineDistance(
        pos.coords.latitude, pos.coords.longitude,
        Number(target.lat), Number(target.lng)
      );

      const meters = Math.round(d);
      showStatus('');
      showDistanceText(`You are ${meters}m away. Allowed: ${radius}m.`);

      document.getElementById('retry')
        .addEventListener('click', () =>
          navigator.geolocation.getCurrentPosition(handlePosition, handleError, {enableHighAccuracy: true})
        );

      if (d <= radius) {
        showStatus('✅ Within radius — redirecting to task…');
        if (target.path) {
          setTimeout(() => window.location.href = target.path + '?verified=1', 700);
        }
      } else {
        showStatus('❌ Not close enough to the target location.');
      }
    };

    const handleError = err => {
      showStatus(err.code === 1
        ? 'Location permission denied.'
        : 'Unable to determine your location.'
      );
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {enableHighAccuracy: true, timeout: 15000});
  }

  document.addEventListener('DOMContentLoaded', start);

})();