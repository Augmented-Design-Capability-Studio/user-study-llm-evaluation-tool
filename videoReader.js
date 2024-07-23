// TO ADD: import extract_keyframes from from './extract_keyframes.js'
// TO DO: create a folder / file path to put the extracted frames into
// API used: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath);

function extractFrames(videoPath, outputDir, timestamps) {
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    if (timestamps || timestamps.length <= 0){
        console.log('Error reading timestamps!');
    }
    const command = ffmpeg(videoPath)
        .output(path.join(outputDir, 'frame_%04d_%H-%M-%S.png')) // Naming method
        .outputOptions('-strftime', '1'); // Allows us to name the files w/ timestamps

    const selectFilter = 'eq(pict_type\\,I)'; // Filter to select keyframes
    const timestampFrames = timestamps.map(ts => {`eq(n\\,${ts})`}).join('+'); // Changes timestamps to frame numbers
    selectFilter = `${selectFilter}+${timestampFrames}`; // Adds to filter

    command.outputOptions('-vf', `select='${selectFilter}'`) // Sets filter
        .outputOptions('-vsync', 'vfr'); // Ensures we output frames at the correct times

    command.on('end', () => {
        console.log('Frames extracted successfully!');
    }).on('error', (err) => {
        console.error('Error extracting frames:', err);
    }).run();
}

// Example usage
const videoPath = 'path/to/video.mp4';
const outputDir = 'path/to/output';
const timestamps = ['00:00:10', '00:01:20']; // Example timestamps

extractFrames(videoPath, outputDir, timestamps);

// Function to feed screenshots to image understanding model

// Function to add data to index.js
