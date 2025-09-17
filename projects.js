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
const db = firebase.firestore();

// Get references to HTML elements
const projectsGridElement = document.getElementById('projectsGrid');
const projectListSpinnerContainer = document.getElementById('projectListSpinnerContainer');
const projectSearchInput = document.getElementById('projectSearchInput');
const clearSearchButton = document.getElementById('clearSearchButton');
const technologyFilter = document.getElementById('technologyFilter');
const tagsFilter = document.getElementById('tagsFilter');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const noProjectsMessage = document.getElementById('noProjectsMessage');

let allProjectsData = [];

/**
 * Fetches project data from 'projects' and statistics from 'statistics', then merges them.
 */
async function fetchProjects() {
    try {
        projectListSpinnerContainer.style.display = 'flex';

        // Fetch projects data
        const projectsSnapshot = await db.collection("projects").get();
        const projects = [];
        const projectIds = [];
        projectsSnapshot.forEach(doc => {
            projects.push({ id: doc.id, ...doc.data() });
            projectIds.push(doc.id);
        });

        // Fetch statistics for all projects
        const statistics = {};
        if (projectIds.length > 0) {
            const statisticsPromises = projectIds.map(id => db.collection("statistics").doc(id).get());
            const statisticsSnapshots = await Promise.all(statisticsPromises);
            statisticsSnapshots.forEach(doc => {
                if (doc.exists) {
                    statistics[doc.id] = doc.data();
                }
            });
        }

        // Merge project data with statistics
        const mergedProjects = projects.map(project => {
            const stats = statistics[project.id] || { views: 0, downloads: 0 };
            return {
                ...project,
                views: stats.views,
                downloads: stats.downloads
            };
        });

        return mergedProjects;
    } catch (error) {
        console.error("Error fetching projects: ", error);
        alert("Failed to load projects. Please check your console for details.");
        return [];
    } finally {
        projectListSpinnerContainer.style.display = 'none';
    }
}

/**
 * Populates filters for technologies and tags.
 */
function populateFilters() {
    const uniqueTechnologies = new Set();
    const uniqueTags = new Set();

    allProjectsData.forEach(project => {
        (project.technologies || []).forEach(tech => uniqueTechnologies.add(tech.trim()));
        (project.tags || []).forEach(tag => uniqueTags.add(tag.trim()));
    });

    technologyFilter.innerHTML = '<option value="">All Technologies</option>';
    Array.from(uniqueTechnologies).sort().forEach(tech => {
        if (tech) {
            const option = document.createElement('option');
            option.value = tech;
            option.textContent = tech;
            technologyFilter.appendChild(option);
        }
    });

    tagsFilter.innerHTML = '<option value="">All Tags</option>';
    Array.from(uniqueTags).sort().forEach(tag => {
        if (tag) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagsFilter.appendChild(option);
        }
    });
}

/**
 * Filters and sorts the projects.
 */
function filterProjects() {
    const searchTerm = projectSearchInput.value.toLowerCase().trim();
    const selectedTechnology = technologyFilter.value.toLowerCase();
    const selectedTag = tagsFilter.value.toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();
    const selectedSort = sortFilter.value;

    let filteredProjects = allProjectsData.filter(project => {
        const name = (project.id || '').toLowerCase();
        const shortDesc = (project.short_description || '').toLowerCase();
        const longDesc = (project.long_description || '').toLowerCase();
        const technologies = (project.technologies || []).map(t => t.toLowerCase());
        const tags = (project.tags || []).map(t => t.toLowerCase());
        const status = (project.project_status || '').toLowerCase();

        const matchesSearch = !searchTerm || name.includes(searchTerm) || shortDesc.includes(searchTerm) || longDesc.includes(searchTerm);
        const matchesTechnology = !selectedTechnology || technologies.includes(selectedTechnology);
        const matchesTag = !selectedTag || tags.includes(selectedTag);
        const matchesStatus = !selectedStatus || status === selectedStatus;

        return matchesSearch && matchesTechnology && matchesTag && matchesStatus;
    });

    // Apply sorting
    switch (selectedSort) {
        case 'name_asc':
            filteredProjects.sort((a, b) => a.id.localeCompare(b.id));
            break;
        case 'date_desc':
            filteredProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'date_asc':
            filteredProjects.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'views_desc':
            filteredProjects.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'views_asc':
            filteredProjects.sort((a, b) => (a.views || 0) - (b.views || 0));
            break;
    }

    renderProjectCards(filteredProjects);
    if (filteredProjects.length === 0 && (searchTerm || selectedTechnology || selectedTag || selectedStatus)) {
        noProjectsMessage.classList.remove('hidden-message');
    } else {
        noProjectsMessage.classList.add('hidden-message');
    }
}

/**
 * Renders project cards.
 */
function renderProjectCards(projects) {
    projectsGridElement.innerHTML = '';

    if (projects.length === 0) return;

    projects.forEach(project => {
        const card = document.createElement('div');
        card.classList.add('project-card');
        card.dataset.projectId = project.id;

        const imageUrl = (project.image_urls && project.image_urls.length > 0) ? project.image_urls[0] : null;
        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${project.id} thumbnail" class="project-card-image" onerror="this.onerror=null;this.src='https://placehold.co/400x250/cccccc/333333?text=Image+Not+Found';" />`
            : `<div class="project-card-image-fallback">${project.id}</div>`;

        const downloadsCount = project.downloads !== undefined ? project.downloads : 0;
        const buttonLabel = project.button_label || 'Downloads';

        const projectStatus = (project.project_status || 'unknown').toLowerCase();
        let statusBadgeClass = '';
        switch (projectStatus) {
            case 'ongoing': statusBadgeClass = 'status-ongoing'; break;
            case 'completed': statusBadgeClass = 'status-completed'; break;
            case 'upcoming': statusBadgeClass = 'status-upcoming'; break;
            default: statusBadgeClass = 'status-unknown';
        }

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
                        <svg class="stat-icon" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 0 12c2.73 4.39 7 7.5 12 7.5s9.27-3.11 12-7.5c-2.73-4.39-7-7.5-12-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        ${project.views !== undefined ? project.views : 0} Views
                    </div>
                    ${
                        buttonLabel.toLowerCase() !== 'none' ? `
                        <div class="project-card-stat-item">
                            <svg class="stat-icon" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                            ${downloadsCount} ${buttonLabel}
                        </div>` : ''
                    }
                </div>
            </div>
        `;

        projectsGridElement.appendChild(card);

        // Update the view count using the statistics collection
        card.addEventListener('click', async () => {
            try {
                const projectRef = db.collection("statistics").doc(project.id);
                await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(projectRef);
                    if (!doc.exists) {
                        // Create the document if it doesn't exist, initializing views to 1 and downloads to 0
                        transaction.set(projectRef, { views: 1, downloads: 0 });
                    } else {
                        // Otherwise, increment the views
                        const newViews = (doc.data().views || 0) + 1;
                        transaction.update(projectRef, { views: newViews });
                    }
                });
            } catch (error) {
                console.error(`Error incrementing views for ${project.id}:`, error);
            }

            window.location.href = `project_detail.html?id=${encodeURIComponent(project.id)}`;
        });
    });
}

// --- Event Listeners ---
projectSearchInput.addEventListener('input', () => {
    filterProjects();
    clearSearchButton.style.display = projectSearchInput.value.trim() !== '' ? 'inline-block' : 'none';
});

clearSearchButton.addEventListener('click', () => {
    projectSearchInput.value = '';
    clearSearchButton.style.display = 'none';
    filterProjects();
});

technologyFilter.addEventListener('change', filterProjects);
tagsFilter.addEventListener('change', filterProjects);
statusFilter.addEventListener('change', filterProjects);
sortFilter.addEventListener('change', filterProjects);

clearFiltersButton.addEventListener('click', () => {
    technologyFilter.value = '';
    tagsFilter.value = '';
    statusFilter.value = '';
    sortFilter.value = '';
    filterProjects();
});

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    allProjectsData = await fetchProjects();
    populateFilters();
    filterProjects();
});