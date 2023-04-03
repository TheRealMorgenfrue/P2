/* global moment */

window['moment-range'].extendMoment(moment);

const parkingSimulation = (function () {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const parkingSimulation = {
        parkingRules: {
            ambulance: {
                days: weekdays,
                times: createRange(moment().set('hour', 21), moment().add(1, 'day').set('hour', 3))
            },
            'fire truck': {
                days: ['Saturday', 'Sunday']
            },
            car: {
                days: weekdays,
                times: createRange(moment().set('hour', 3), moment().set('hour', 15))
            },
            bicycle: {
                days: weekdays,
                times: createRange(moment().set('hour', 15), moment().set('hour', 21))
            }
        },
        dropZone: document.querySelector('.drop-zone'),
        vehicleArray: [...document.querySelectorAll('.vehicles img')],
        dragged: null,
        areVehiclesFiltered: false
    }
    return Object.seal(parkingSimulation);
})();


function addEventListeners() {
    const filterButton = document.querySelector('.drag-vehicle .filter-vehicles');
    const showButton = document.querySelector('.drag-vehicle .show-all');
    const vehicles = document.querySelector('.vehicles');
    const dropZone = parkingSimulation.dropZone;

    vehicles.addEventListener('dragstart', onDragStart);
    vehicles.addEventListener('dragend', onDragEnd);
    dropZone.addEventListener('drop', onDrop);
    dropZone.addEventListener('dragenter', onDragEnter);
    dropZone.addEventListener('dragleave', onDragLeave);
    dropZone.addEventListener('dragover', onDragOver);
    filterButton.addEventListener('click', showVehiclesThatCanPark);
    showButton.addEventListener('click', resetVehicles);
}

function createRange(start, end) {
    if (start && end) {
        return moment.range(start, end);
    }
}

function onDragStart(event) {
    let target = event.target;
    if (target && target.nodeName == 'IMG') {
        // Store a ref. on the dragged elem
        const imgSrc = target.src;
        parkingSimulation.dragged = target;
        event.dropEffect = 'linkMove';
        event.dataTransfer.setData('text/uri-list', imgSrc);
        event.dataTransfer.setData('text/plain', imgSrc);

        // Make it half transparent
        event.target.style.opacity = .5;
    }
}

function onDragEnd(event) {
    if (event.target && event.target.nodeName == 'IMG') {
        // Reset the transparency
        event.target.style.opacity = '';
    }
}

function contains(list, value) {
    for (let i = 0; i < list.length; ++i) {
        if (list[i] === value) return true;
    }
    return false;
}

function onDragOver(event) {
    // Prevent default to allow drop
    event.preventDefault();
}

function validateTarget(target) {
    const dropZone = parkingSimulation.dropZone;
    return (target.parentNode === dropZone || target === dropZone) ? dropZone : null;
}

function onDragLeave(event) {
    const target = validateTarget(event.target);
    target.style.background = '';
}

function onDragEnter(event) {
    const target = validateTarget(event.target);
    const dragged = parkingSimulation.dragged;
    if (dragged && target) {
        const isLink = contains(event.dataTransfer.types, 'text/uri-list');
        const vehicleType = dragged.alt;
        if (isLink && canPark(vehicleType)) {
            event.preventDefault();
            // Set the dropEffect to move
            event.dataTransfer.dropEffect = 'linkMove'
            target.style.background = '#1f904e';
        }
        else {
            target.style.backgroundColor = '#d51c00';
        }
    }
}

function onDrop(event) {
    const target = validateTarget(event.target);
    const dragged = parkingSimulation.dragged;
    if (dragged && target) {
        const isLink = contains(event.dataTransfer.types, 'text/uri-list');
        const vehicleType = dragged.alt;
        target.style.backgroundColor = '';
        if (isLink && canPark(vehicleType)) {
            event.preventDefault();
            // Get the id of the target and add the moved element to the target's DOM
            dragged.parentNode.removeChild(dragged);
            dragged.style.opacity = '';
            target.appendChild(dragged);

            // Add this line to set the vehicle ID
            target.vehicle_id = dragged.id;
        }
    }
}

function getDay() {
    return moment().format('dddd');
}

function getHours() {
    return moment().hour();
}

function canPark(vehicle) {
    // Check the time and the type of vehicle being dragged to see if it can park at this time
    const parkingRules = parkingSimulation.parkingRules;
    if (vehicle && parkingRules[vehicle]) {
        const rules = parkingRules[vehicle];
        const validDays = rules.days;
        const validTimes = rules.times;
        const curDay = getDay();
        if (validDays) {
            return validDays.includes(curDay) && (validTimes ? validTimes.contains(moment()) : true);
        }
    }
    return false;
}

function showVehiclesThatCanPark() {
    parkingSimulation.vehicleArray.filter((vehicle) => {
        return !canPark(vehicle.alt);
    }).forEach((vehicle) =>{
        vehicle.classList.add('hide');
    });
    parkingSimulation.areVehiclesFiltered = true;
}

function resetVehicles() {
    if (parkingSimulation.areVehiclesFiltered) {
        parkingSimulation.vehicleArray.forEach((vehicle) => {
            vehicle.classList.remove('hide');
        });
        parkingSimulation.areVehiclesFiltered = false;
    }
}
addEventListeners();
