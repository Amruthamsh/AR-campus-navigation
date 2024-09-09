let camera, scene, renderer;
let controller;

const locations = [];
let currentDestination = null;
let navigationArrow;

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    const arButton = ARButton.createButton(renderer, {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
    });
    document.body.appendChild(arButton);

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Create navigation arrow
    const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 32);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    navigationArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    navigationArrow.rotation.x = Math.PI / 2;
    navigationArrow.visible = false;
    scene.add(navigationArrow);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelect() {
    const geometry = new THREE.SphereGeometry(0.03, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random() });
    const location = new THREE.Mesh(geometry, material);
    location.position.set(0, 0, -0.5).applyMatrix4(controller.matrixWorld);
    location.quaternion.setFromRotationMatrix(controller.matrixWorld);
    scene.add(location);
    locations.push(location);

    console.log('Location added:', location.position);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (currentDestination) {
        updateNavigationArrow();
    }
    renderer.render(scene, camera);
}

function updateNavigationArrow() {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const direction = currentDestination.position.clone().sub(cameraPosition);
    
    navigationArrow.position.copy(cameraPosition);
    navigationArrow.position.y -= 0.2; // Place the arrow slightly below the camera
    navigationArrow.lookAt(currentDestination.position);
    
    const distance = direction.length();
    navigationArrow.scale.z = Math.min(distance, 0.5); // Adjust arrow length based on distance
    
    navigationArrow.visible = true;
}

function navigateTo(locationIndex) {
    if (locationIndex >= 0 && locationIndex < locations.length) {
        currentDestination = locations[locationIndex];
        navigationArrow.visible = true;
        console.log('Navigating to location:', currentDestination.position);
    } else {
        console.error('Invalid location index');
    }
}

function stopNavigation() {
    currentDestination = null;
    navigationArrow.visible = false;
    console.log('Navigation stopped');
}

// Expose functions to window for easy access
window.navigateTo = navigateTo;
window.stopNavigation = stopNavigation;