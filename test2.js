// Function to convert time string (HH:MM) to minutes since midnight
function timeToMinutes(time) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 60 * + minutes;
}

// Function to check if a specific time is within a time frame
function isTimeInRange(time, startTime, endTime) {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    console.log(timeMinutes,startMinutes,endMinutes)

    // Assuming the time frame does not cross midnight
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

// Example usage
const time = "14:30"; // Specific time
const startTime = "09:00"; // Start of the time frame
const endTime = "17:00"; // End of the time frame

if (isTimeInRange(time, startTime, endTime)) {
    console.log(`${time} is within the time frame of ${startTime} to ${endTime}.`);
} else {
    console.log(`${time} is not within the time frame of ${startTime} to ${endTime}.`);
}
