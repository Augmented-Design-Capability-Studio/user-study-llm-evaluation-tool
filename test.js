import {readTranscription, readWOZQuestions, injectWOZQuestions, removeWOZQuestions, saveTranscriptToFile} from "./transcriptReader.js";


    const transcript = readTranscription('data/P04/P04_DesignSession.srt');
    const wozQuestions = await readWOZQuestions('data/P04/P04.csv');

    const transcriptWithoutWOZ = removeWOZQuestions(transcript, wozQuestions);
    const transcriptWithWOZ = injectWOZQuestions(transcriptWithoutWOZ, wozQuestions);

    saveTranscriptToFile("test.txt", transcriptWithoutWOZ)
    saveTranscriptToFile("test2.txt", transcriptWithWOZ)

    // console.log('Transcript with WOZ:', transcriptWithWOZ);
    // console.log('Transcript without WOZ:', transcriptWithoutWOZ);

