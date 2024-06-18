document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.target;
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;

            const data = { email, password };
            console.log('Login data:', data); // Log the data being sent

            try {
                const response = await loginUser(data);
                if (response.ok) {
                    const result = await response.json();
                    console.log('User logged in:', result);
                    localStorage.setItem('accessToken', result.data.accessToken);
                    localStorage.setItem('user', JSON.stringify(result.data));
                    await createApiKey(result.data.accessToken);
                    alert('Login successful!');
                    window.location.href = 'form.html';
                } else {
                    const errorData = await response.json();
                    console.error('Login failed:', errorData);
                    alert('Login failed: ' + errorData.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during login.');
            }
        });
    }

    // Function to login user
    async function loginUser(data) {
        const response = await fetch('https://v2.api.noroff.dev/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response;
    }

    // Create API key
    async function createApiKey(accessToken) {
        try {
            const response = await fetch('https://v2.api.noroff.dev/auth/create-api-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ name: "Markerfestivalen API Key" }) // Include a name for the API key
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('apiKey', data.data.key);
            } else {
                console.error('Failed to create API key:', data);
                throw new Error(data.message || 'Failed to create API key');
            }
        } catch (error) {
            console.error('Error creating API key:', error);
            alert('An error occurred while creating the API key.');
        }
    }

    // Form submission
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const answer1 = document.getElementById('question1').value;
            const answer2 = document.getElementById('question2').value;
            const answer3 = document.getElementById('question3').value;
            const answer4 = document.getElementById('question4').value;
            const answer5 = document.getElementById('question5').value;
            const answer6 = document.getElementById('question6').value;
            const answer7 = document.getElementById('question7').value;
            const answer8 = document.getElementById('question8').value;

            const combinedData = `First Name: ${firstName}\nQuestion1: ${answer1}\nQuestion2: ${answer2}\nQuestion3: ${answer3}\nQuestion4: ${answer4}\nQuestion5: ${answer5}\nQuestion6: ${answer6}\nQuestion7: ${answer7}\nQuestion8: ${answer8}`;

            const postData = {
                title: `Submission by ${firstName}`,
                body: combinedData,
                tags: ["submission", "form"], // Adding optional tags
                media: {
                    url: "https://via.placeholder.com/150", // Ensure this is a valid, publicly accessible URL
                    alt: "Submission Image"
                }
            };

            console.log('Post data:', postData); // Log the post data being sent

            const accessToken = localStorage.getItem('accessToken');
            const apiKey = localStorage.getItem('apiKey');
            const user = JSON.parse(localStorage.getItem('user'));

            try {
                const response = await fetch(`https://v2.api.noroff.dev/blog/posts/${user.name}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Noroff-API-Key': apiKey
                    },
                    body: JSON.stringify(postData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error response from server:', errorData);
                    console.log('Request headers:', {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Noroff-API-Key': apiKey
                    });
                    console.log('Request body:', postData);
                    throw new Error(errorData.message || 'Error submitting the form');
                }

                alert('Form submitted successfully!');
                window.location.href = 'form.html';
            } catch (error) {
                console.error('Error:', error);
                alert(`Failed to submit form: ${error.message}`);
            }
        });
    }

    // Delete post
    async function deletePost(userName, postId) {
        const accessToken = localStorage.getItem('accessToken');
        const apiKey = localStorage.getItem('apiKey');
        try {
            const response = await fetch(`https://v2.api.noroff.dev/blog/posts/${userName}/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Noroff-API-Key': apiKey
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from server:', errorData);
                throw new Error(errorData.message || 'Error deleting the post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

   if (window.location.pathname.endsWith('admin.html')) {
        const accessToken = localStorage.getItem('accessToken');
        const apiKey = localStorage.getItem('apiKey');

        fetch('https://v2.api.noroff.dev/blog/posts/Markerfestivalen', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Noroff-API-Key': apiKey
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('submissionsTable').querySelector('tbody');
            data.data.forEach(post => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${post.body.split('\n')[0].split(': ')[1]}</td>
                    <td>${post.body.split('\n').slice(1).join('<br>')}</td>
                    <td><button class="delete-button" data-post-id="${post.id}">Delete</button></td>
                `;
                tableBody.appendChild(row);
            });

            // Add delete functionality
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const postId = this.getAttribute('data-post-id');
                    const confirmDelete = confirm('Are you sure you want to delete this post?');
                    if (confirmDelete) {
                        try {
                            const user = JSON.parse(localStorage.getItem('user'));
                            await deletePost(user.name, postId);
                            alert('Post deleted successfully!');
                            // Remove the deleted row from the table
                            this.closest('tr').remove();
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            alert('An error occurred while deleting the post.');
                        }
                    }
                });
            });
        })
        .catch(error => console.error('Error:', error));

        document.getElementById('copyData').addEventListener('click', function() {
            let combinedData = '';
            document.querySelectorAll('#submissionsTable tbody tr').forEach(row => {
                const nameCell = row.cells[0].innerText;
                const dataCell = row.cells[1].innerText;

                if (nameCell && dataCell) {
                    combinedData += `${nameCell}\n${dataCell.replace(/<br>/g, '\n')}\n\n`;
                }
            });
            navigator.clipboard.writeText(combinedData).then(() => {
                alert('Data copied!');
            }).catch(err => console.error('Error copying data:', err));
        });
    }
    // Carousel functionality
    const questions = document.querySelectorAll('.question');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    let currentStep = 0;

    function showQuestion(step) {
        questions.forEach((question, index) => {
            question.classList.toggle('active', index === step);
        });
    }

    function updateButtons() {
        if (currentStep === 0) {
            prevButton.style.display = 'none';
        } else {
            prevButton.style.display = 'inline-block';
        }

        if (currentStep === questions.length - 1) {
            nextButton.style.display = 'none';
            submitButton.style.display = 'inline-block';
        } else {
            nextButton.style.display = 'inline-block';
            submitButton.style.display = 'none';
        }
    }

    prevButton.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showQuestion(currentStep);
            updateButtons();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentStep < questions.length - 1) {
            currentStep++;
            showQuestion(currentStep);
            updateButtons();
        }
    });

    // Initialize the form
    showQuestion(currentStep);
    updateButtons();
});









