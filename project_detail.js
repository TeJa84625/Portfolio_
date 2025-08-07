// project_detail.js

// Initialize Firebase with your provided configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWoqHihUtSWubkoOTzykbxjtuiIFfgDWg",
    authDomain: "portfolio-baf28.firebaseapp.com",
    databaseURL: "https://portfolio-baf28-default-rtdb.firebaseio.com",
    projectId: "portfolio-baf28",
    storageBucket: "portfolio-baf28.firebasestorage.app",
    messagingSenderId: "631350351739",
    appId: "1:631350351739:web:1a1352cc2b9384b5924fde",
    measurementId: "G-103VQ05CTT"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const projectDetailsPage = document.getElementById('projectDetailsPage');
    const projectDetailSpinnerContainer = document.getElementById('projectDetailSpinnerContainer');
    const pageTitle = document.getElementById('pageTitle');

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    let currentProjectData = null;

    if (projectId) {
        fetchProjectDetails(projectId);
    } else {
        displayErrorMessage("Project ID not found in URL. Please go back to the <a href='projects.html'>Projects List</a> to select a project.");
        hideSpinner();
    }

    async function fetchProjectDetails(id) {
        try {
            projectDetailSpinnerContainer.style.display = 'flex';
            const docRef = db.collection("projects").doc(id);
            const doc = await docRef.get();

            if (doc.exists) {
                currentProjectData = { id: doc.id, ...doc.data() };

                // Use `project.title` if available; otherwise fallback to `project.id` which is the name
                const projectTitle = currentProjectData.title || currentProjectData.id || 'Untitled Project';

                renderProjectDetails(currentProjectData);

                pageTitle.textContent = projectTitle + " Details";
                document.title = projectTitle;
            } else {
                displayErrorMessage("Project not found.");
            }
        } catch (error) {
            console.error("Error fetching project details:", error);
            displayErrorMessage("Failed to load project details. Please try again later.");
        } finally {
            hideSpinner();
        }
    }

    function renderProjectDetails(project) {
        const normalizedStatus = (project.project_status || '').trim().toLowerCase();

        let difficultyColorClass = '';
        if (project.difficulty) {
            const lowerCaseDifficulty = project.difficulty.toLowerCase();
            if (lowerCaseDifficulty === 'advance' || lowerCaseDifficulty === 'advanced') {
                difficultyColorClass = 'text-red-600'; // Red for Advance
            } else if (lowerCaseDifficulty === 'intermediate') {
                difficultyColorClass = 'text-yellow-500'; // Yellow for Intermediate
            } else if (lowerCaseDifficulty === 'beginner') {
                difficultyColorClass = 'text-green-600'; // Green for Beginner
            } else {
                difficultyColorClass = 'text-gray-700'; // Default color if not matched
            }
        }

        projectDetailsPage.innerHTML = `
        <h2 class="text-blue-600 font-bold text-6xl mb-6 mt-0 text-center w-full">${ project.id || 'Untitled Project'}</h2>
        <div class="meta-info">
            ${project.client ? `<div><strong>Client:</strong> ${project.client}</div>` : ''}
            ${project.date ? `<div><strong>Date:</strong> ${project.date}</div>` : ''}
            ${project.duration ? `<div><strong>Duration:</strong> ${project.duration}</div>` : ''}
            ${project.status ? `<div><strong>Status:</strong> ${project.status}</div>` : ''}
            ${project.upload_date ? `<div><strong>Uploaded:</strong> ${project.upload_date}</div>` : ''}
            ${project.last_updated ? `<div><strong>Last Updated:</strong> ${project.last_updated}</div>` : ''}
            ${project.views !== undefined ? `<div><strong>Views:</strong> ${project.views}</div>` : ''}
            ${project.button_label && project.button_label.toLowerCase() !== 'none' ? `
                    <div class="project-card-stat-item">
                        <svg class="stat-icon" viewBox="0 0 24 24">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        ${project.downloads || 0} ${project.button_label}
                    </div>`
                    : ''}
            ${project.difficulty ? `<div><strong>Difficulty:</strong> <span class="${difficultyColorClass}">${project.difficulty}</span></div>` : ''}
        </div>

        <div class="tags">
            <h3 class="text-gray-700 border-b-2 border-gray-200 pb-2 mt-9 mb-5 text-2xl w-full">Tags:</h3>
            ${project.tags && project.tags.length > 0 ? project.tags.map(tag => `<span>${tag}</span>`).join('') : '<p>No tags available.</p>'}
        </div>

        <div class="technologies">
            <h3>Technologies Used:</h3>
            ${project.technologies && project.technologies.length > 0 ? project.technologies.map(tech => `<span>${tech}</span>`).join('') : '<p>No technologies listed.</p>'}
        </div>

        ${project.image_urls && project.image_urls.length > 0 ? `
            <h3>Project Images</h3>
            <div class="image-carousel-container">
                <div class="image-carousel" id="imageCarousel">
                    ${project.image_urls.map(image => `<img src="${image}" alt="Project Image" class="carousel-image">`).join('')}
                </div>
                ${project.image_urls.length > 1 ? `
                    <button class="carousel-button left" id="prevImage">❮</button>
                    <button class="carousel-button right" id="nextImage">❯</button>
                ` : ''}
            </div>
        ` : ''}

        <h3>Project Overview</h3>
        <p class="short-description">${project.short_description || 'No short description provided.'}</p>
        <h3>Project Details</h3>
        <p class="long-description">${project.long_description || 'No detailed description provided.'}</p>


        ${project.video_url ? `
            <h3>Project Video</h3>
            <div class="video-embed">
                <iframe src="https://www.youtube.com/embed/${getYouTubeVideoId(project.video_url)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        ` : ''}

        ${project.code ? `
            <h3>Code Snippet</h3>
            <div class="code-container">
                <button id="copyCodeButton" class="copy-btn" aria-label="Copy code">📁 Copy Code</button>
                <pre class="code-block"><code>${escapeHtml(project.code)}</code></pre>
            </div> 
        ` : ''}

        ${project.sponsors && project.sponsors.length > 0 ? `
            <div class="sponsors-section">
                <h3>Our Sponsors</h3>
                <div class="sponsors-list">
                    ${project.sponsors.map(sponsor => `<span class="sponsor-name">${sponsor}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${project.members && project.members.length > 0 ? `
            <div class="members-section">
                <h3>Team Members</h3>
                <div class="members-scroll-container">
                    <div class="members-list">
                        ${project.members.map(member => `<span class="member-name">${member}</span>`).join('')}
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="action-buttons-container">
            ${project.button_url ? `<a href="${project.button_url}" target="_blank" rel="noopener noreferrer" class="action-button" id="projectActionButton">${project.button_label || 'View Project'}</a>` : ''}
            ${normalizedStatus !== "completed" ? `
                <a href="join_project.html?projectName=${encodeURIComponent(project.title || project.id || '')}&projectId=${encodeURIComponent(project.id)}" class="action-button join-project-button">Join This Project</a>
            ` : ''}
        </div>
    `;

        setupCarousel(project.image_urls);
        setupLightbox();
        setupActionButtonListener(project);
        setupCopyCodeButton();
    }

    function setupCopyCodeButton() {
        const copyButton = document.getElementById('copyCodeButton');
        const codeBlock = document.querySelector('.code-block code');

        if (copyButton && codeBlock) {
            copyButton.addEventListener('click', () => {
                const textarea = document.createElement('textarea');
                textarea.value = codeBlock.textContent;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                copyButton.textContent = '✅ Copied!';
                setTimeout(() => {
                    copyButton.textContent = '📁 Copy Code';
                }, 10000);
            });
        }
    }

    function hideSpinner() {
        if (projectDetailSpinnerContainer) {
            projectDetailSpinnerContainer.style.display = 'none';
        }
    }

    function displayErrorMessage(message) {
        projectDetailsPage.innerHTML = `<p class="error-message">${message}</p>`;
        hideSpinner();
    }

    function getYouTubeVideoId(url) {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    let currentImageIndex = 0;
    let images = [];

    function setupCarousel(projectImages) {
        images = projectImages || [];
        const imageCarousel = document.getElementById('imageCarousel');
        const prevButton = document.getElementById('prevImage');
        const nextButton = document.getElementById('nextImage');

        if (!imageCarousel || images.length === 0) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            return;
        }

        function updateCarousel() {
            if (imageCarousel) {
                imageCarousel.style.transform = `translateX(-${currentImageIndex * 100}%)`;
            }
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex === 0) ? images.length - 1 : currentImageIndex - 1;
                updateCarousel();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex === images.length - 1) ? 0 : currentImageIndex + 1;
                updateCarousel();
            });
        }
    }

    function setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxClose = document.getElementsByClassName('lightbox-close')[0];
        let scale = 1;

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('carousel-image')) {
                scale = 1;
                lightboxImage.style.transform = `scale(${scale})`;
                lightbox.style.display = 'flex';
                lightboxImage.src = event.target.src;
                lightboxImage.alt = event.target.alt || '';
            }
        });

        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => {
                lightbox.style.display = 'none';
            });
        }

        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    lightbox.style.display = 'none';
                }
            });
        }

        lightboxImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomStep = 0.1;
            if (e.deltaY < 0) {
                scale += zoomStep;
            } else {
                scale = Math.max(1, scale - zoomStep);
            }
            lightboxImage.style.transform = `scale(${scale})`;
        });
    }

    function setupActionButtonListener(project) {
        const actionButton = document.getElementById('projectActionButton');
        if (actionButton && project.button_label && project.button_url) {
            actionButton.addEventListener('click', async (event) => {
                event.preventDefault();

                if (!project || !project.id) {
                    window.open(project.button_url, '_blank');
                    return;
                }

                const projectRef = db.collection("projects").doc(project.id);
                try {
                    if (project.button_label === "Download" || project.button_label === "Visit Website") {
                        const docSnapshot = await projectRef.get();
                        if (!docSnapshot.exists) {
                            window.open(project.button_url, '_blank');
                            return;
                        }

                        await projectRef.update({
                            downloads: firebase.firestore.FieldValue.increment(1)
                        });
                    }
                } catch (error) {
                    console.error(`Error incrementing stats:`, error);
                } finally {
                    window.open(project.button_url, '_blank');
                }
            });
        }
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
