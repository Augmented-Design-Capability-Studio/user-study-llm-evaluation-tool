// TO ADD: import extract_keyframes from from './extract_keyframes.js'
// TO DO: create a folder / file path to put the extracted frames into

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// sets the paths used
ffmpeg.setFfmpegPath(ffmpegPath);

// function to extract keyframes
const extract_keyframes = (videoPath, outputDir) => {
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    ffmpeg(videoPath)
        .output(path.join(outputDir, 'frame_%04d_%H-%M-%S.png')) // naming method 
        .outputOptions('-vf', 'select=eq(pict_type\\,I)') // only selects keyframes
        .outputOptions('-vsync', 'vfr') // only adds keyframes to output
        .outputOptions('-strftime', '1') // allows us to name the files w/ timestamps
        .on('end', () => {
            console.log('Keyframes extracted successfully!');
        })
        .on('error', (err) => {
            console.error('Error extracting keyframes:', err);
        })
        .run();
  };

// exports function
export default extract_keyframes;