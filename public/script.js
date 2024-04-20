document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const quizContainer = document.getElementById('quiz');
    const submitButton = document.getElementById('submit');
    const feedbackContainer = document.getElementById('feedback');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    let data;
    let currentQuestionIndex = 0;
    let selectedAnswers = new Array(); // Array to store selected answers

    // Fetch quiz questions from the server
    fetch('/api/questions')
        .then(response => response.json())
        .then(quizData => {
            data = quizData;
            showQuestion(currentQuestionIndex);
            updateButtonVisibility();
        });

    // Function to display current question
    function showQuestion(index) {
        const question = data.questions[index];
        const questionElement = document.createElement('div');
        questionElement.innerHTML = `
            <h3>${index + 1}. ${question.question}</h3>
            <ul>
                ${question.options.map((option, i) => `
                    <li>
                        <input type="radio" name="question${index}" value="${i}" ${isSelected(index, i) ? 'checked' : ''}>
                        <label>${option}</label>
                    </li>
                `).join('')}
            </ul>
        `;
        quizContainer.innerHTML = '';
        quizContainer.appendChild(questionElement);
    }

    // Event listener for radio button click
    quizContainer.addEventListener('change', (event) => {
        const target = event.target;
        if (target.type === 'radio') {
            const questionIndex = parseInt(target.name.replace('question', ''));
            const optionIndex = parseInt(target.value);
            selectedAnswers[questionIndex] = optionIndex; // Update selected answer array
        }
    });

    // Function to check if an option is selected for a specific question
    function isSelected(questionIndex, optionIndex) {
        return selectedAnswers[questionIndex] === optionIndex;
    }

    // Event listener for previous button click
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
            updateButtonVisibility();
        }
    });

    // Event listener for next button click
    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < data.questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
            updateButtonVisibility();
        }
    });

    submitButton.addEventListener('click', () => {
        // Check if all questions have been answered
        for (let i = 0; i < data.questions.length; i++) {
            if (typeof selectedAnswers[i] === 'undefined') {
                alert('Please answer all questions before submitting.');
                return;
            }
        }
    
        // Collect selected answers
        const answers = [];
        for (let i = 0; i < data.questions.length; i++) {
            answers.push(selectedAnswers[i]);
        }
    
        // Send user answers to the server for scoring
        fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answers
                })
            })
            .then(response => response.json())
            .then(data => {
                // Hide quiz and display feedback
                quizContainer.style.display = 'none';
                feedbackContainer.style.display = 'block';
                submitButton.style.display = 'none';
                prevButton.style.display = 'none';
                nextButton.style.display = 'none';
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                // Display result feedback
                displayResult(data);
            });
    });
    

    // Function to update button visibility based on current question index
    function updateButtonVisibility() {
        if (currentQuestionIndex === 0) {
            prevButton.style.display = 'none';
        } else {
            prevButton.style.display = 'inline-block';
        }

        if (currentQuestionIndex === data.questions.length - 1) {
            nextButton.style.display = 'none';
            submitButton.style.display = 'inline-block';
        } else {
            nextButton.style.display = 'inline-block';
            submitButton.style.display = 'none';
        }
    }

    // Function to display quiz result feedback
    function displayResult(result) {
        const scoreContainer = document.createElement('div');
        scoreContainer.innerHTML = `
          <h2>Your Score: ${result.score} / ${result.totalQuestions}</h2>
        `;
        feedbackContainer.innerHTML = '';
        feedbackContainer.appendChild(scoreContainer);

        const feedbackHeader = document.createElement('h3');
        feedbackHeader.textContent = 'Feedback:';
        feedbackContainer.appendChild(feedbackHeader);

        // Loop through each feedback item and display details
        result.feedback.forEach((feedback, index) => {
            const feedbackElement = document.createElement('p');
            feedbackElement.innerHTML = `<b>Question ${index + 1}: ${feedback.question}</b>`;
            feedbackContainer.appendChild(feedbackElement);

            const userAnswerElement = document.createElement('p');
            userAnswerElement.innerHTML = `<b>Your Answer:</b> ${feedback.userAnswer}`;
            feedbackContainer.appendChild(userAnswerElement);

            const correctAnswerElement = document.createElement('p');
            correctAnswerElement.innerHTML = `<b>Correct Answer:</b> ${feedback.correctAnswer}`;
            feedbackContainer.appendChild(correctAnswerElement);

            const correctAnswerStatus = document.createElement('p');
            correctAnswerStatus.textContent = feedback.isCorrect ? 'Correct' : 'Incorrect';
            correctAnswerStatus.style.color = feedback.isCorrect ? 'green' : 'red';
            feedbackContainer.appendChild(correctAnswerStatus);

            const lineBreak = document.createElement('hr');
            feedbackContainer.appendChild(lineBreak);
        });
    }
});