// projects.js

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

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
const loadingScreen = document.getElementById('loadingScreen');
const paginationContainer = document.getElementById('paginationContainer'); 

let allProjectsData = [];
let filteredAndSortedProjects = [];
let currentPage = 1;
const projectsPerPage = 9;

// --- Data Fetching ---

async function fetchProjects() {
    try {
        projectListSpinnerContainer.style.display = 'flex';

        const projectsSnapshot = await db.collection("projects").get();
        const projects = [];
        const projectIds = [];
        projectsSnapshot.forEach(doc => {
            projects.push({ id: doc.id, ...doc.data() });
            projectIds.push(doc.id);
        });

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

// --- Filtering and Sorting ---

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

function getProjectDate(project) {
    const dateString = project.upload_date || project.created_at;
    return dateString ? new Date(dateString) : new Date(0);
}

function filterProjects() {
    const searchTerm = projectSearchInput.value.toLowerCase().trim();
    const selectedTechnology = technologyFilter.value.toLowerCase();
    const selectedTag = tagsFilter.value.toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();
    const selectedSort = sortFilter.value;

    let tempFilteredProjects = allProjectsData.filter(project => {
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

    switch (selectedSort) {
        case 'name_asc':
            tempFilteredProjects.sort((a, b) => a.id.localeCompare(b.id));
            break;
        case 'date_desc':
            tempFilteredProjects.sort((a, b) => getProjectDate(b) - getProjectDate(a));
            break;
        case 'date_asc':
            tempFilteredProjects.sort((a, b) => getProjectDate(a) - getProjectDate(b));
            break;
        case 'views_desc':
            tempFilteredProjects.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'views_asc':
            tempFilteredProjects.sort((a, b) => (a.views || 0) - (b.views || 0));
            break;
    }

    filteredAndSortedProjects = tempFilteredProjects;
    
    currentPage = 1; 

    renderPaginatedProjects();
    
    if (filteredAndSortedProjects.length === 0 && (searchTerm || selectedTechnology || selectedTag || selectedStatus)) {
        noProjectsMessage.classList.remove('hidden-message');
    } else {
        noProjectsMessage.classList.add('hidden-message');
    }
}

// --- Pagination and Rendering ---

function renderPaginatedProjects() {
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const projectsToRender = filteredAndSortedProjects.slice(startIndex, endIndex);

    renderProjectCards(projectsToRender);
    renderPaginationControls(filteredAndSortedProjects.length);
    
    if (projectsGridElement) {
        projectsGridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToPage(pageNumber) {
    currentPage = pageNumber;
    renderPaginatedProjects();
}

function renderPaginationControls(totalProjects) {
    const totalPages = Math.ceil(totalProjects / projectsPerPage);
    paginationContainer.innerHTML = ''; 

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = `px-4 py-2 mx-1 rounded-lg ${currentPage === 1 ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => goToPage(currentPage - 1);
    paginationContainer.appendChild(prevButton);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
    } else if (currentPage > totalPages - 3) {
        startPage = Math.max(1, totalPages - 4);
    }

    if (startPage > 1) {
        const firstPageButton = createPageButton(1, currentPage);
        paginationContainer.appendChild(firstPageButton);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPageButton(i, currentPage);
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'px-2';
            paginationContainer.appendChild(ellipsis);
        }
        const lastPageButton = createPageButton(totalPages, currentPage);
        paginationContainer.appendChild(lastPageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = `px-4 py-2 mx-1 rounded-lg ${currentPage === totalPages ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`;
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => goToPage(currentPage + 1);
    paginationContainer.appendChild(nextButton);
}

function createPageButton(page, activePage) {
    const button = document.createElement('button');
    button.textContent = page;
    button.onclick = () => goToPage(page);
    button.className = `px-4 py-2 mx-1 rounded-lg transition-colors duration-200 ${
        page === activePage 
        ? 'bg-blue-600 text-white font-bold shadow-md' 
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
    }`;
    return button;
}

function renderProjectCards(projects) {
    projectsGridElement.innerHTML = '';

    if (projects.length === 0) return;

    projects.forEach(project => {
        const card = document.createElement('div');
        card.classList.add('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-xl', 'overflow-hidden', 'transform', 'hover:scale-[1.02]', 'transition', 'duration-300', 'ease-in-out', 'relative', 'cursor-pointer');
        card.dataset.projectId = project.id;

        const imageUrl = (project.image_urls && project.image_urls.length > 0) ? project.image_urls[0] : null;
        
        // --- UPDATED IMAGE CONTAINER FOR 16:9 ASPECT RATIO ---
        const imageHtml = `
            <div class="relative w-full pb-[56.25%] bg-gray-200 dark:bg-gray-700 dark:text-gray-100 text-gray-500 font-bold text-xl overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="p-2">${project.id}</span>
                </div>
                ${imageUrl ? `<img src="${imageUrl}" alt="${project.id} thumbnail" class="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500" onload="this.classList.add('opacity-100')" onerror="this.remove()" />` : ''}
            </div>
        `;
        // pb-[56.25%] ensures a 16:9 aspect ratio (9/16 = 0.5625)

        const downloadsCount = project.downloads !== undefined ? project.downloads : 0;
        const buttonLabel = project.button_label || 'Downloads';

        const projectStatus = (project.project_status || 'unknown').toLowerCase();
        let statusBadgeClass = '';
        let statusText = project.project_status || 'Status N/A';
        switch (projectStatus) {
            case 'ongoing':
                statusBadgeClass = 'bg-yellow-500 text-yellow-900';
                break;
            case 'completed':
                statusBadgeClass = 'bg-green-500 text-green-900';
                break;
            case 'upcoming':
                statusBadgeClass = 'bg-blue-500 text-blue-900';
                break;
            default:
                statusBadgeClass = 'bg-gray-400 text-gray-800';
                statusText = 'N/A';
        }

        card.innerHTML = `
            <div class="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                <div class="relative">
                    ${imageHtml}

                    <div class="absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow-md ${statusBadgeClass} z-10">
                        ${statusText}
                    </div>
                </div>

                <div class="p-4">
                    <h3 class="text-xl font-bold mb-2 truncate text-gray-900 dark:text-white">
                    ${project.id}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        ${project.short_description || 'No description provided.'}
                    </p>
                    <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-2">

                        <div class="flex items-center space-x-1">
                            <svg class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 0 12c2.73 4.39 7 7.5 12 7.5s9.27-3.11 12-7.5c-2.73-4.39-7-7.5-12-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            <span>${project.views !== undefined ? project.views : 0} Views</span>
                        </div>

                        ${
                            buttonLabel.toLowerCase() !== 'none' ? `
                            <div class="flex items-center space-x-1">
                                <svg class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                </svg>
                                <span>${downloadsCount} ${buttonLabel}</span>
                            </div>` : ''
                        }
                    </div>
                </div>
            </div>
        `;

        projectsGridElement.appendChild(card);

        card.addEventListener('click', async () => {
            loadingScreen.style.display = 'flex';

            try {
                const projectRef = db.collection("statistics").doc(project.id);
                await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(projectRef);
                    if (!doc.exists) {
                        transaction.set(projectRef, { views: 1, downloads: 0 });
                    } else {
                        const newViews = (doc.data().views || 0) + 1;
                        transaction.update(projectRef, { views: newViews });
                    }
                });
            } catch (error) {
                console.error(`Error incrementing views for ${project.id}:`, error);
                loadingScreen.style.display = 'none';
                return;
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

document.addEventListener('DOMContentLoaded', async () => {
    allProjectsData = await fetchProjects();
    populateFilters();
    filterProjects();
});