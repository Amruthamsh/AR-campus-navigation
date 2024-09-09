let scene, camera, renderer, arrow, targetLocation = null;
let userPosition = new THREE.Vector3(0, 0, 0);  // Initial position of the user
let arrowDirection = new THREE.Vector3(0, 0, 0);
let session = null;
let xrReferenceSpace = null;

// Setup Three.js Scene
function initThreeJS() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add basic cube for visual reference
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -0.5);  // Place cube slightly in front of user
    scene.add(cube);

    // Create arrow helper for navigation
    const dir = new THREE.Vector3(0, 0, -1); // Initial direction for arrow
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 1;
    const hex = 0xffff00;
    arrow = new THREE.ArrowHelper(dir, origin, length, hex);
    scene.add(arrow);
}

// Handle WebXR Initialization
async function initWebXR() {
    if (navigator.xr) {
        session = await navigator.xr.requestSession("immersive-ar", { requiredFeatures: ['local-floor'] });

        // Set up the WebGL rendering context for AR
        session.updateRenderState({
            baseLayer: new XRWebGLLayer(session, renderer.getContext())
        });
        
        xrReferenceSpace = await session.requestReferenceSpace('local-floor');

        session.requestAnimationFrame(onXRFrame);

        document.body.appendChild(renderer.domElement);
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    } else {
        alert('WebXR is not supported by this device');
    }
}

// Handle WebXR Frame Rendering
function onXRFrame(time, frame) {
    const session = frame.session;
    session.requestAnimationFrame(onXRFrame);

    const pose = frame.getViewerPose(xrReferenceSpace);
    if (pose) {
        const pos = pose.transform.position;
        userPosition.set(pos.x, pos.y, pos.z);
        updateNavigation();
    }
}

// Add a location
document.getElementById("add-location").addEventListener("click", () => {
    if (userPosition) {
        targetLocation = userPosition.clone(); // Save the current user position as the target
        console.log(`Location added at: (${targetLocation.x}, ${targetLocation.y}, ${targetLocation.z})`);
    }
});

// Start navigation
document.getElementById("start-navigation").addEventListener("click", () => {
    if (targetLocation) {
        console.log('Navigation started');
        navigateToLocation();
    } else {
        alert('No location set. Please add a location first.');
    }
});

// Update the direction of the arrow towards the target
function updateNavigation() {
    if (targetLocation) {
        arrowDirection.subVectors(targetLocation, userPosition).normalize();
        arrow.setDirection(arrowDirection);
    }
}

// Navigate towards the target location
function navigateToLocation() {
    const distance = userPosition.distanceTo(targetLocation);
    if (distance < 0.1) {
        console.log("Arrived at the target location!");
    }
}

// Initialize everything
function init() {
    initThreeJS();
    initWebXR();
}

init();
