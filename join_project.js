// ... Firebase initialization (keep this part as-is) ...

document.addEventListener('DOMContentLoaded', () => {
    const pageHeading = document.getElementById('pageHeading');
    const formProjectTitle = document.getElementById('formProjectTitle');
    const backToProjectButton = document.getElementById('backToProjectButton');

    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userMessageInput = document.getElementById('userMessage');
    const isSponsorCheckbox = document.getElementById('isSponsor');
    const sponsorFieldsDiv = document.getElementById('sponsorFields');
    const fundAmountInput = document.getElementById('fundAmount');
    const transactionIdInput = document.getElementById('transactionId');
    const joinProjectForm = document.getElementById('joinProjectForm');
    const formMessage = document.getElementById('formMessage');

    // QR code elements
    const generateQrButton = document.getElementById('generateQrButton');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeDiv = document.getElementById('qrCodeDiv');
    const paymentStatus = document.getElementById('paymentStatus');
    const yourUpiId = "6301619629.wallet@phonepe";

    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('projectName');
    const projectId = urlParams.get('projectId');

    if (projectName) {
        pageHeading.textContent = `Join ${projectName}`;
        formProjectTitle.textContent = `Join "${projectName}"`;
    }

    if (projectId) {
        backToProjectButton.href = `project_detail.html?id=${projectId}`;
    } else {
        backToProjectButton.href = 'projects.html';
    }

    isSponsorCheckbox.addEventListener('change', () => {
        const isChecked = isSponsorCheckbox.checked;
        sponsorFieldsDiv.style.display = isChecked ? 'block' : 'none';

        fundAmountInput.required = isChecked;
        transactionIdInput.required = isChecked;

        if (!isChecked) {
            fundAmountInput.value = '';
            transactionIdInput.value = '';
            paymentStatus.textContent = '';
            qrCodeContainer.style.display = 'none';
            qrCodeDiv.innerHTML = '';
        }
    });

    generateQrButton.addEventListener('click', () => {
        const amount = parseFloat(fundAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        // Check if the amount is less than 10
        if (amount < 10) {
            alert("The minimum sponsorship amount is ₹10.");
            return;
        }

        const transactionNote = `Funding for Project: ${projectName || 'Generic Project'}`;
        const upiUrl = `upi://pay?pa=${yourUpiId}&pn=Portfolio&tn=${encodeURIComponent(transactionNote)}&am=${amount.toFixed(2)}&cu=INR`;

        qrCodeDiv.innerHTML = '';
        qrCodeContainer.style.display = 'flex';

        if (typeof QRCode !== 'undefined') {
            new QRCode(qrCodeDiv, {
                text: upiUrl,
                width: 200,
                height: 200,
                colorDark: "#000",
                colorLight: "#fff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // Increase the timeout delay significantly to ensure rendering is complete
            // Also, check if it's a canvas or img, and remove title from both parent and child
            setTimeout(() => {
                // Try to find an img element within the qrCodeDiv
                const qrImage = qrCodeDiv.querySelector('img');
                if (qrImage) {
                    qrImage.removeAttribute('title');
                    console.log("Removed title from img tag.");
                }

                // Try to find a canvas element within the qrCodeDiv
                const qrCanvas = qrCodeDiv.querySelector('canvas');
                if (qrCanvas) {
                    // QRCode.js might set the title on the canvas itself
                    qrCanvas.removeAttribute('title');
                    console.log("Removed title from canvas tag.");
                }

                // Sometimes the title is set on the parent container itself
                if (qrCodeDiv.hasAttribute('title')) {
                    qrCodeDiv.removeAttribute('title');
                    console.log("Removed title from qrCodeDiv.");
                }

            }, 500); // Increased delay to 500ms - you can even try 1000ms if needed
            paymentStatus.textContent = "Scan the QR code to make your payment.";
            paymentStatus.style.color = "#007bff";
        } else {
            paymentStatus.textContent = "QR Code library not found.";
            paymentStatus.style.color = "#dc3545";
        }
    });

    joinProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = "Submitting your application...";
        formMessage.className = "form-message animate-show";

        const userName = userNameInput.value.trim();
        const userEmail = userEmailInput.value.trim();
        const userMessage = userMessageInput.value.trim();
        const isSponsor = isSponsorCheckbox.checked;
        const amount = isSponsor ? fundAmountInput.value.trim() : "#";
        const transactionId = isSponsor ? transactionIdInput.value.trim() : "#";

        // Sponsor validation
        if (isSponsor) {
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                formMessage.textContent = "Please enter a valid sponsorship amount.";
                formMessage.className = "form-message error animate-show";
                return;
            }
            // Check if the amount is less than 10
            if (parseFloat(amount) < 10) {
                formMessage.textContent = "The minimum sponsorship amount is ₹10.";
                formMessage.className = "form-message error animate-show";
                return;
            }
            if (!transactionId) {
                formMessage.textContent = "Please enter a transaction ID.";
                formMessage.className = "form-message error animate-show";
                return;
            }
        }

        // Google Form URL with mapped entries
        const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSdeulDHC05Ug16iyAp19MUI334OlqmlrYYt2lF1dCYFe0DtPw/formResponse` +
            `?entry.1328315084=${encodeURIComponent(projectName || "Unknown Project")}` +
            `&entry.1878610209=${encodeURIComponent(userName)}` +
            `&entry.1587908217=${encodeURIComponent(userEmail)}` +
            `&entry.1876828639=${encodeURIComponent(userMessage)}` +
            `&entry.1057306725=${encodeURIComponent(amount)}` +
            `&entry.1746085745=${encodeURIComponent(transactionId)}`;

        try {
            await fetch(formURL, {
                method: 'POST',
                mode: 'no-cors'
            });

            formMessage.textContent = "Thank you! Your application has been submitted.";
            formMessage.className = "form-message success animate-show";

            joinProjectForm.reset();
            sponsorFieldsDiv.style.display = 'none';
            qrCodeContainer.style.display = 'none';
            qrCodeDiv.innerHTML = '';

        } catch (error) {
            console.error("Form submission failed:", error);
            formMessage.textContent = "Failed to submit. Please try again.";
            formMessage.className = "form-message error animate-show";
        }

        // Optional: Hide the message after 5 seconds
        setTimeout(() => {
            formMessage.classList.remove("animate-show");
        }, 5000);
    });
});
