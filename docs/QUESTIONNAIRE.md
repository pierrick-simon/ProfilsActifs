### Form Version
The questionnaire version is configured in the `.env` file. The file name must match the selected version, for example:

- `.env`: `FORM_VERSION=v1`
- file: `certification/questions.v1.json`

The application will load the JSON file corresponding to the configured version.

### Form File
The form file is located in the `certification` directory and must be valid JSON.

The root object must look like this:

```json
{
  "questions": [
    {
      "id": 1,
      "question": "Example question",
      "type": "single-choice",
      "options": {
        "choices": ["A", "B", "C"],
        "answer": "B"
      },
      "weight": 1
    }
  ]
}
```

### Question structure
Each item in the `questions` array must contain:

- `id`: unique integer identifier
- `question`: the prompt shown to the user
- `type`: the question type
- `options`: a configuration object for the answer format
- `weight`: the value assigned to the question in the final score

### Supported question types

#### 1) `single-choice`
Use this type for one valid answer among multiple choices.

```json
{
  "id": 1,
  "question": "Quelle est la capitale de la France ?",
  "type": "single-choice",
  "options": {
    "choices": ["Berlin", "Madrid", "Paris", "Rome"],
    "answer": "Paris"
  },
  "weight": 1
}
```

- `choices`: array of strings
- `answer`: one exact string from `choices`

#### 2) `true-false`
A boolean question.

```json
{
  "id": 2,
  "question": "Est-ce vrai ?",
  "type": "true-false",
  "options": {
    "answer": true
  },
  "weight": 1
}
```

- `answer`: `true` or `false`

#### 3) `free-answer`
This is an open question where the answer is not fixed by the system.

```json
{
  "id": 3,
  "question": "Que pensez-vous de l'océan pacifique ?",
  "type": "free-answer",
  "options": {
    "answer": null
  },
  "weight": 1
}
```

- `answer`: must be `null` when there is no correct answer.
- `null` means the question is subjective / free text and no single answer is expected.

#### 4) `date`
Use this type for a date answer.

```json
{
  "id": 4,
  "question": "Quel jour l'an 2000 a-t-il eu lieu ?",
  "type": "date",
  "options": {
    "answer": "01-01-2000"
  },
  "weight": 1
}
```

- `answer`: a date string in the expected format used by the application (example: `DD-MM-YYYY`)

#### 5) `multiple-choice`
For questions with several correct answers.

```json
{
  "id": 5,
  "question": "Quels chiffres sont strictement positifs ?",
  "type": "multiple-choice",
  "options": {
    "choices": ["-5", "3", "0", "27"],
    "answer": ["3", "27"]
  },
  "weight": 1
}
```

- `choices`: array of possible answers
- `answer`: array of valid selected values

#### 6) `numeric`
For numerical answers.

```json
{
  "id": 6,
  "question": "Combien font 66 + 44 ?",
  "type": "numeric",
  "options": {
    "answer": 110
  },
  "weight": 1
}
```

- `answer`: a number

### Important rules

- The JSON file must be valid and use double quotes for all strings.
- `id` values must be unique.
- Every question should have a `weight` value.
- If a question has no strictly correct answer, set `options.answer` to `null`.
- For `single-choice` and `multiple-choice`, the `choices` array is required.
- For `true-false`, `date`, and `numeric`, the `answer` is a literal value and not wrapped in an array.

### Example complete file

```json
{
  "questions": [
    {
      "id": 1,
      "question": "Quelle est la capitale de la France ?",
      "type": "single-choice",
      "options": {
        "choices": ["Berlin", "Madrid", "Paris", "Rome"],
        "answer": "Paris"
      },
      "weight": 1
    },
    {
      "id": 2,
      "question": "Est-ce vrai ?",
      "type": "true-false",
      "options": {
        "answer": true
      },
      "weight": 1
    },
    {
      "id": 3,
      "question": "Que pensez-vous de l'océan pacifique ?",
      "type": "free-answer",
      "options": {
        "answer": null
      },
      "weight": 1
    }
  ]
}
```

This is the format expected by the certification form. The `answer: null` convention is used when the question has no predefined correct response.
