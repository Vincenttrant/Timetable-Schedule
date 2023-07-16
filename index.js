import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js'
import { getDatabase, ref, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js'

// Firebase configuration
const appSettings = {
    databaseURL: 'Your database URL'
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const timetableInDB = ref(database, 'timetable')


// Dom Elements
const addModal = document.querySelector('.add-modal-overlay');
const saveModal = document.querySelector('.save-modal-overlay');
const editModal = document.querySelector('.edit-modal-overlay');
const addModalBtn = document.querySelector('.add-btn');
const saveModalBtn = document.querySelector('.save-btn');
const editBtn = document.querySelector('.edit-btn');
const closeBtn = document.querySelectorAll('.close-btn');
const deleteBtn = document.querySelector('.delete-btn');

const colorBtn = document.querySelectorAll('.color-btn');
const root = document.documentElement;

const submitAddBtn = document.getElementById('add-modal-submit');
const titleInput = document.getElementById('add-modal-title');
const daysInput = document.querySelectorAll('#add-modal-day');
const daySelection = document.querySelectorAll('.form-days-selection');
const starttimeInput = document.getElementById('start-time');
const endtimeInput = document.getElementById('end-time');

const printBtn = document.querySelector('.print-btn');
const downloadBtn = document.querySelector('.download-btn');

const eventContainer = document.querySelector('.event-container');
const errorContainer = document.querySelector('.error-container');

const days = {'Su': 1, 'Mo': 2, 'Tu': 3, 'We': 4, 'Th': 5, 'Fr': 6, 'Sa': 7, };

let clickedSlot;



onValue(timetableInDB, (snapshot) => {
    let timetableArray = Object.entries(snapshot.val());

    const parentElement = document.querySelector('.event-container');

    while(parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }

    let dayColumn = [];

    for(let i = 0; i < timetableArray.length; i++) {
        let currentDayColumn = timetableArray[i];
        let currentDayColumnValue = currentDayColumn[1];

        dayColumn.push(currentDayColumnValue.dayColumn);

    }

    for(let i = 0; i < timetableArray.length; i++) {
        let currentItem = timetableArray[i];
        let currentItemValue = currentItem[1];

        const eventSlot = createEventSlot(currentItemValue.title, dayColumn, currentItemValue.startTime, currentItemValue.endTime, currentItemValue.startRow, currentItemValue.rowLength, currentItemValue.color, i);
    
        const parentElement = document.querySelector('.event-container');
        parentElement.appendChild(eventSlot);
    }
})




// Functions
function getAddTitle() {
    return titleInput.value;
}

function getAddDayNumbers() {
    const addDayNumbers = [];
    
    daysInput.forEach(day => {
        if (day.checked) {
            const dayName = day.parentElement.textContent.trim();
            addDayNumbers.push(days[dayName]);
        }
    });

    return addDayNumbers;
}

function getAddTime(){
    const startTime = starttimeInput.value;
    const endTime = endtimeInput.value;
  
    const startTimeSplit = startTime.split(':');
    const endTimeSplit = endTime.split(':');
  
    const startHour = parseInt(startTimeSplit[0]);
    const startMin = parseInt(startTimeSplit[1]);
  
    const endHour = parseInt(endTimeSplit[0]);
    const endMin = parseInt(endTimeSplit[1]);
  
    const addStartTime = (startHour - 8) * 60 + startMin + 1;
    const addEndTime = (endHour - 8) * 60 + endMin + 1;
  
    const addClassLength = addEndTime - addStartTime;

  
    return [startTime, endTime, addStartTime, addClassLength];
}

function getAddColor(){
    const bgColor = document.querySelector('.active');
    const colorClass = bgColor.classList[1];
    const colorValue = getComputedStyle(root).getPropertyValue(`--${colorClass}`);
    
    return colorValue;
}

function validTime(start, end){
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    const validStart = new Date(`2000-01-01 8:00`);
    const validEnd = new Date(`2000-01-01 19:00`);

    return startTime >= validStart && endTime <= validEnd;
}

function clearInputs() {
    titleInput.value = '';

    daysInput.forEach(day => {
        day.checked = false;
    });

    starttimeInput.value = '08:00';
    endtimeInput.value = '19:00';

    const activeColor = document.querySelector('.active');
    if (activeColor) {
      activeColor.classList.remove('active');
    }
}

function convertTime24hrto12hr(time){
    const timeSplit = time.split(':');
    const hour = parseInt(timeSplit[0]);
    
    const startTime = hour > 12 ? hour - 12 : hour;

    const startTime12hr = `${startTime}:${timeSplit[1]}`;
    return startTime12hr;
}

function convertTime12hrto24hr(time){
    const timeSplit = time.split(':');
    const hour = parseInt(timeSplit[0]);

    
    const startTime = hour >= 8 ? hour : hour + 12;

    if(startTime < 10){
        return `0${startTime}:${timeSplit[1]}`;
    }
    else{
        return `${startTime}:${timeSplit[1]}`;
    }
}

function createEventSlot(addTitle, addDayNumbers, startTime, endTime, addStartTime, addClassLength, addColorValue, i) {
    const eventSlot = document.createElement('div');
    eventSlot.classList.add('slot');
    eventSlot.style.height = `${addClassLength}px`;
    eventSlot.style.gridRow = addStartTime;
    eventSlot.style.gridColumn = addDayNumbers[i];
    eventSlot.style.backgroundColor = addColorValue;


    const startStandardTime = convertTime24hrto12hr(startTime);
    const endStandardTime = convertTime24hrto12hr(endTime);

    const slotTitle = document.createElement('span');
    slotTitle.textContent = addTitle;
    
    const slotTime = document.createElement('span');
    slotTime.textContent = `${startStandardTime} - ${endStandardTime}`;

    
    eventSlot.appendChild(slotTitle);
    eventSlot.appendChild(slotTime);
    
    return eventSlot;
}

function deleteSlot(clickedSlot){
    clickedSlot.remove()

    const slotTitle = clickedSlot.querySelector('span').textContent;
    const slotTime = clickedSlot.querySelector('span:nth-child(2)').textContent;
    const slotDay = clickedSlot.style.gridColumn;
    const slotColor = clickedSlot.style.backgroundColor;

    onValue(timetableInDB, (snapshot) =>{

        if(snapshot.exists()) {
            let timetableArray = Object.entries(snapshot.val());
            for(let i = 0; i < timetableArray.length; i++){
                const currentItem = timetableArray[i];
                const currentItemID = currentItem[0];
                const currentItemValue = currentItem[1];

                const startStandardTime = convertTime24hrto12hr(currentItemValue.startTime);
                const endStandardTime = convertTime24hrto12hr(currentItemValue.endTime);


                if(
                currentItemValue.title == slotTitle &&
                startStandardTime == slotTime.split(' - ')[0] &&
                endStandardTime == slotTime.split(' - ')[1] &&
                currentItemValue.dayColumn == parseInt(slotDay[0]) &&
                currentItemValue.color == slotColor
                ){
                    remove(ref(database, `timetable/${currentItemID}`));
                }
            }
        } 
        else {
            console.log('No data available');
        }
        
    });
}




// Event Listeners

addModalBtn.addEventListener('click', () => {
    daySelection.forEach( (day) => {
        day.style.visibility = 'visible';
    });
    
    clearInputs();

    addModal.classList.add('open-modal');
});

saveModalBtn.addEventListener('click', () => {
    saveModal.classList.add('open-modal');
});

closeBtn.forEach( (button) => {
    button.addEventListener('click', () => {
        if (clickedSlot) {
            clickedSlot = null;
        }
        addModal.classList.remove('open-modal');
        saveModal.classList.remove('open-modal');
        editModal.classList.remove('open-modal');
    });
});

colorBtn.forEach( (button) => {
    button.addEventListener('click', () => {
        colorBtn.forEach( (btn) => {
            btn.classList.remove('active');
        });

    button.classList.add('active');

    const colorValue = getAddColor();
    root.style.setProperty('--active-bg-color', colorValue);
    });
});


submitAddBtn.addEventListener('click', () => {
    const addTitle = getAddTitle();
    const addDayNumbers = getAddDayNumbers();
    const [startTime, endTime, addStartTime, addClassLength] = getAddTime();
    const addColorValue = getAddColor();

    if(validTime(startTime, endTime)) {
        errorContainer.style.display = 'none';

        for(let i = 0; i < addDayNumbers.length; i++){
            const eventSlot = createEventSlot(addTitle, addDayNumbers, startTime, endTime, addStartTime, addClassLength, addColorValue, i);
    
            const parentElement = document.querySelector('.event-container');
            parentElement.appendChild(eventSlot);

            const newTimetable = {
                title: addTitle,
                dayColumn: addDayNumbers[i],
                startRow: addStartTime,
                startTime: startTime,
                endTime: endTime,
                rowLength: addClassLength,
                color: addColorValue
            };
            push(timetableInDB, newTimetable);
        };
        clearInputs();

        if (clickedSlot) {
            deleteSlot(clickedSlot);
        }

        addModal.classList.remove('open-modal');
    }
    else {
        errorContainer.textContent = 'Invalid time range.';
        errorContainer.style.display = 'block';
    }
});

eventContainer.addEventListener('click', (event) => {
    clickedSlot = event.target.closest('.slot');

    if(clickedSlot) {
        editModal.classList.add('open-modal');
    }

    deleteBtn.addEventListener('click', () => {
        deleteSlot(clickedSlot);
        editModal.classList.remove('open-modal');
    });

    daysInput.forEach( (day) => {
            day.checked = false;
    });
});

editBtn.addEventListener('click', () => {
    editModal.classList.remove('open-modal');

    daySelection.forEach( (day) => {
        day.style.visibility = 'hidden';
    });

    clearInputs();

    const slotTitle = clickedSlot.querySelector('span').textContent;
    const slotTime = clickedSlot.querySelector('span:nth-child(2)').textContent;
    const slotDay = clickedSlot.style.gridColumn;
    const slotColor = clickedSlot.style.backgroundColor;

    const newSlotStartTime = convertTime12hrto24hr(slotTime.split(' - ')[0]);
    const newSlotEndTime = convertTime12hrto24hr(slotTime.split(' - ')[1]);


    titleInput.value = slotTitle;
    starttimeInput.value = newSlotStartTime;
    endtimeInput.value = newSlotEndTime;



    daysInput.forEach( (day) => {
        var dayName = day.parentElement.textContent.trim();
        if(days[dayName] == parseInt(slotDay[0])) {
            day.checked = true;
        }
    });

    colorBtn.forEach( (button) => {
        button.classList.remove('active');
        const styles = window.getComputedStyle(button);

        if(styles.borderColor === slotColor) {
            button.classList.add('active');
        }
    });

    const bgColor = getAddColor();
    root.style.setProperty('--active-bg-color', bgColor);
    
    addModal.classList.add('open-modal');
});

printBtn.addEventListener('click', () => {
    addModal.classList.remove('open-modal');
    saveModal.classList.remove('open-modal');

    daySelection.forEach( (day) => {
        day.style.visibility = 'hidden';
    });
    
    window.print();
});

window.onload = function() {
    downloadBtn.addEventListener('click', () => {
        addModal.classList.remove('open-modal');
        saveModal.classList.remove('open-modal');   

        eventContainer.classList.add('pdf-download');

        const contents = this.document.getElementById('grid-container');
        var opt = {
            margin:       0,
            filename:     'timetable.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 1 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(contents).save().then(() => {
            eventContainer.classList.remove('pdf-download');
        }); 
    });
};
