# TODO for Claire

## Understand `index.js`
- Familiarize yourself with the code in `index.js`.
- Ask Anna any questions you have for clarification.

## Modify `index.js`

- The command to run the script should be:
  ```bash
  node index.js [FOLDER_NAME] [TRANSCRIPT] [SCREENSHOT] [ENGINE] [MODEL] [ASSISTANT]
  ```

- Depending on the engine specified, the script should call either `openai.js` or `claude.js`. Both of these scripts need to be written.

[TRANSCRIPT] Whether the transcript contains the wizard questions or not. 
[SCREENSHOT] Whether the data includes screenshots of the user's work or not. 
[ENGINE] The API we are using - OpenAI or Claude.
[MODEL] The model we are using for the specific APIs. OpenAI - 4 or 4o. Claude - sonnet.
[ASSISTANT] The assistant version we are testing: Pythia, Socratais, or Hephaistus. 

### Tasks for `openai.js`

- Load the system prompt up until the comment section and feed it to the API.
- Read the correct transcript (either Wizard or No Wizard).
- Load screenshots if necessary.
- Loop through the transcripts.
- When the timestamp is hit for the Wizard question, make an API call to OpenAI to get:
  - **Generated Response**: The assistant's question.
  - **Generated Understanding**: A brief summary of what is currently going on in the study.
- Save all the generated responses and generated understandings (along with their timestamps) in a data structure such as a list of dictionaries.
- Convert this list of dictionaries into a CSV file, attach the appropriate metadata at the top, and save it in the correct folder.

### Tasks for `claude.js`

- Implement similar functionality as in `openai.js` but using the Claude API.

## Download the Data in a Specific Way

- Ensure all necessary data is available. If any data is missing, ask Frederick for assistance.
- Example directory structure:

```plaintext
data/
|——— P01/
|     |————openai/
|     |       |————pythia/
|     |       |————socratais/
|     |       |————hephaistus/
|     |————claude/
|     |       |————pythia/
|     |       |————socratais/
|     |       |————hephaistus/
|     |___ P01_meta.json
|     |___ P01_commands.sh
|     |___ P01_OriginalTranscript.srt
|     |___ P01_NoWizardTranscript.srt
|     |___ P01_WizardTranscript.srt
|     |___ P01_WizardQuestions.csv
```

- Utilize functions in `transcriptReader.js` to create `NoWizardTranscript.srt` and `WizardTranscript.srt`.

## Testing

- Ensure that the scripts are thoroughly tested.
- Verify that the generated CSV files contain the correct metadata and data.
- Confirm that the output directory structure matches the specified format.

---

This detailed TODO should help guide your student through the necessary modifications and tasks.