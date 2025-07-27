// projects.js

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Get Firestore instance

// Get references to HTML elements
const projectsGridElement = document.getElementById('projectsGrid');
const projectListSpinnerContainer = document.getElementById('projectListSpinnerContainer');
const projectSearchInput = document.getElementById('projectSearchInput');
const clearSearchButton = document.getElementById('clearSearchButton');
const technologyFilter = document.getElementById('technologyFilter');
const tagsFilter = document.getElementById('tagsFilter');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const noProjectsMessage = document.getElementById('noProjectsMessage');

let allProjectsData = []; // Store all fetched projects to filter client-side

/**
 * Fetches all projects from the 'projects' Firestore collection.
 * @returns {Promise<Array>} A promise that resolves with an array of project data.
 */
async function fetchProjects() {
    try {
        projectListSpinnerContainer.style.display = 'flex'; // Show spinner (flex for centering)
        const projectsCollection = db.collection("projects");
        const snapshot = await projectsCollection.get();
        const projects = [];
        snapshot.forEach(doc => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        return projects;
    } catch (error) {
        console.error("Error fetching projects: ", error);
        alert("Failed to load projects. Please check your console for details.");
        return [];
    } finally {
        projectListSpinnerContainer.style.display = 'none'; // Hide spinner
    }
}

/**
 * Populates unique technologies and tags into their respective filter dropdowns.
 */
function populateFilters() {
    const uniqueTechnologies = new Set();
    const uniqueTags = new Set();

    allProjectsData.forEach(project => {
        if (project.technologies && Array.isArray(project.technologies)) {
            project.technologies.forEach(tech => uniqueTechnologies.add(tech.trim()));
        }
        if (project.tags && Array.isArray(project.tags)) {
            project.tags.forEach(tag => uniqueTags.add(tag.trim()));
        }
    });

    // Populate Technology Filter
    technologyFilter.innerHTML = '<option value="">All Technologies</option>'; // Keep default option
    Array.from(uniqueTechnologies).sort().forEach(tech => {
        if (tech) { // Ensure no empty strings
            const option = document.createElement('option');
            option.value = tech;
            option.textContent = tech;
            technologyFilter.appendChild(option);
        }
    });

    // Populate Tags Filter
    tagsFilter.innerHTML = '<option value="">All Tags</option>'; // Keep default option
    Array.from(uniqueTags).sort().forEach(tag => {
        if (tag) { // Ensure no empty strings
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagsFilter.appendChild(option);
        }
    });
}


/**
 * Filters projects based on current search and filter selections.
 */
function filterProjects() {
    const searchTerm = projectSearchInput.value.toLowerCase().trim();
    const selectedTechnology = technologyFilter.value.toLowerCase();
    const selectedTag = tagsFilter.value.toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();

    const filteredProjects = allProjectsData.filter(project => {
        const projectName = project.id ? project.id.toLowerCase() : '';
        const shortDescription = project.short_description ? project.short_description.toLowerCase() : '';
        const longDescription = project.long_description ? project.long_description.toLowerCase() : '';
        const projectTechnologies = project.technologies ? project.technologies.map(t => t.toLowerCase()) : [];
        const projectTags = project.tags ? project.tags.map(t => t.toLowerCase()) : [];
        const projectStatus = project.project_status ? project.project_status.toLowerCase() : '';

        // Search by text
        const matchesSearch = searchTerm === '' ||
                              projectName.includes(searchTerm) ||
                              shortDescription.includes(searchTerm) ||
                              longDescription.includes(searchTerm);

        // Filter by technology
        const matchesTechnology = selectedTechnology === '' ||
                                  projectTechnologies.includes(selectedTechnology);

        // Filter by tag
        const matchesTag = selectedTag === '' ||
                           projectTags.includes(selectedTag);

        // Filter by status
        const matchesStatus = selectedStatus === '' ||
                              projectStatus === selectedStatus;

        return matchesSearch && matchesTechnology && matchesTag && matchesStatus;
    });

    renderProjectCards(filteredProjects); // Re-render the grid with filtered projects
    if (filteredProjects.length === 0 && (searchTerm !== '' || selectedTechnology !== '' || selectedTag !== '' || selectedStatus !== '')) {
        noProjectsMessage.classList.remove('hidden-message');
    } else {
        noProjectsMessage.classList.add('hidden-message');
    }
}


/**
 * Renders all projects as cards in the grid.
 * @param {Array} projects - An array of project data.
 */
function renderProjectCards(projects) {
    projectsGridElement.innerHTML = ''; // Clear existing cards

    if (projects.length === 0) {
        // Only show "No projects match" if filters are active
        // The filterProjects function already handles showing/hiding this message
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.classList.add('project-card');
        card.dataset.projectId = project.id; // Store project ID on the card

        // Determine image to use
        const imageUrl = (project.image_urls && project.image_urls.length > 0) ? project.image_urls[0] : null;
        let imageHtml = '';
        if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" alt="${project.id} thumbnail" class="project-card-image" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Image+Not+Found';" />`;
        } else {
            // Fallback: project name as text on a colored background
            imageHtml = `<div class="project-card-image-fallback">${project.id}</div>`;
        }

        // Show only Downloads count, remove visits
        const downloadsCount = project.downloads !== undefined ? project.downloads : 0;
        const buttonLabel = project.button_label || 'Downloads';

        // Determine project status and class for styling
        const projectStatus = project.project_status ? project.project_status.toLowerCase() : 'unknown';
        let statusBadgeClass = '';
        switch (projectStatus) {
            case 'ongoing':
                statusBadgeClass = 'status-ongoing';
                break;
            case 'completed':
                statusBadgeClass = 'status-completed';
                break;
            case 'upcoming':
                statusBadgeClass = 'status-upcoming';
                break;
            default:
                statusBadgeClass = 'status-unknown';
        }

        // for shord discription <p class="project-card-description">${project.short_description || 'No description available.'}</p>
        card.innerHTML = `
            <div class="project-status-badge ${statusBadgeClass}">
                ${project.project_status || 'Status N/A'}
            </div>
            <div class="project-card-image-container">
                ${imageHtml}
            </div>
            <div class="project-card-content">
                <h3 class="project-card-title">${project.id}</h3> 
                <div class="project-card-stats">
                    <div class="project-card-stat-item">
                        <svg class="stat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 0 12c2.73 4.39 7 7.5 12 7.5s9.27-3.11 12-7.5c-2.73-4.39-7-7.5-12-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        ${project.views !== undefined ? project.views : 0} Views
                    </div>
                    <div class="project-card-stat-item">
                        <svg class="stat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                        ${downloadsCount} ${buttonLabel}
                    </div>
                </div>
            </div>
        `;

        projectsGridElement.appendChild(card);

        // Add click event listener to each card
        card.addEventListener('click', async () => {
            // Increment views in Firestore
            try {
                const projectRef = db.collection("projects").doc(project.id);
                // Using transaction for safe increment if multiple users click at once
                await db.runTransaction(async (transaction) => {
                    const sfDoc = await transaction.get(projectRef);
                    if (!sfDoc.exists) {
                        throw "Document does not exist!";
                    }
                    const newViews = (sfDoc.data().views || 0) + 1;
                    transaction.update(projectRef, { views: newViews });
                });
                console.log(`Views incremented for ${project.id}`);
            } catch (error) {
                console.error(`Error incrementing views for ${project.id}:`, error);
                // Optionally, increment locally even if Firestore fails
                // project.views = (project.views || 0) + 1;
                // update card stat
            }

            // Navigate to the detail page
            window.location.href = `project_detail.html?id=${encodeURIComponent(project.id)}`;
        });
    });
}

// --- Event Listeners for Filtering and Search ---

projectSearchInput.addEventListener('input', () => {
    filterProjects();
    // Show/hide clear search button
    if (projectSearchInput.value.trim() !== '') {
        clearSearchButton.style.display = 'inline-block';
    } else {
        clearSearchButton.style.display = 'none';
    }
});

clearSearchButton.addEventListener('click', () => {
    projectSearchInput.value = '';
    clearSearchButton.style.display = 'none';
    filterProjects();
});

technologyFilter.addEventListener('change', filterProjects);
tagsFilter.addEventListener('change', filterProjects);
statusFilter.addEventListener('change', filterProjects);

clearFiltersButton.addEventListener('click', () => {
    technologyFilter.value = '';
    tagsFilter.value = '';
    statusFilter.value = '';
    filterProjects(); // Re-apply filters
});

// Initial load: Fetch projects, populate filters, and render cards
document.addEventListener('DOMContentLoaded', async () => {
    allProjectsData = await fetchProjects(); // Fetch once and store
    populateFilters();
    filterProjects(); // Initial render with no filters applied
});