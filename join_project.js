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

    // QR code elements
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeDiv = document.getElementById('qrCodeDiv');
    const paymentStatus = document.getElementById('paymentStatus');
    const yourUpiId = "6301619629.wallet@phonepe";

    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('projectName') || 'Your Project';
    const projectId = urlParams.get('projectId');

    if (projectName) {
        pageHeading.textContent = `Join ${projectName}`;
        formProjectTitle.textContent = `Join "${projectName}"`;
    }

    backToProjectButton.href = projectId ? `project_detail.html?id=${projectId}` : 'projects.html';

    // Hint below fund input
    const fundAmountNote = document.createElement('small');
    fundAmountNote.className = 'text-gray-500 block mt-1';
    fundAmountNote.textContent = 'Minimum sponsorship amount is ₹10.';
    fundAmountInput.parentNode.insertBefore(fundAmountNote, fundAmountInput.nextSibling);

    isSponsorCheckbox.addEventListener('change', () => {
        const isChecked = isSponsorCheckbox.checked;
        sponsorFieldsDiv.style.display = isChecked ? 'block' : 'none';

        fundAmountInput.required = isChecked;
        transactionIdInput.required = isChecked;

        if (!isChecked) clearQrAndButton();
    });

    fundAmountInput.addEventListener('input', () => {
        if (!isSponsorCheckbox.checked) return;

        const amount = parseFloat(fundAmountInput.value);
        if (!isNaN(amount) && amount >= 10) {
            generateUpiPaymentQr(amount);
        } else {
            clearQrAndButton();
        }
    });

    function clearQrAndButton() {
        qrCodeDiv.innerHTML = '';
        qrCodeContainer.style.display = 'none';

        const existingBtn = document.getElementById('upiPaymentBtn');
        if (existingBtn) existingBtn.remove();

        paymentStatus.textContent = '';
    }

function generateUpiPaymentQr(amount) {
    const transactionNote = `Funding for Project: ${projectName}`;
    const transactionRef = 'TXN' + Date.now();  // Unique transaction ref (optional but recommended)
    const websiteUrl = window.location.origin; // Your website URL

    const upiUrl = `upi://pay?pa=${yourUpiId}&pn=Portfolio&tn=${encodeURIComponent(transactionNote)}&am=${amount.toFixed(2)}&cu=INR&tr=${transactionRef}&url=${encodeURIComponent(websiteUrl)}`;

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

        const existingBtn = document.getElementById('upiPaymentBtn');
        if (existingBtn) existingBtn.remove();

        const upiBtn = document.createElement('button');
        upiBtn.id = 'upiPaymentBtn';
        upiBtn.textContent = 'Pay Using UPI App';
        upiBtn.className = 'mt-4 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition';
        upiBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = upiUrl;
            } else {
                alert("To make a payment, please open this page on your mobile device or scan the QR code.");
            }
        });

        qrCodeContainer.appendChild(upiBtn);
        paymentStatus.textContent = "Scan the QR code or use the button below to pay.";
        paymentStatus.className = "text-blue-600 mt-2";
    } else {
        paymentStatus.textContent = "QR Code library not found.";
        paymentStatus.className = "text-red-600";
    }
}


    joinProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userName = userNameInput.value.trim();
    const userEmail = userEmailInput.value.trim();
    const userMessage = userMessageInput.value.trim();
    const isSponsor = isSponsorCheckbox.checked;
    const amount = isSponsor ? fundAmountInput.value.trim() : "#";
    const transactionId = isSponsor ? transactionIdInput.value.trim() : "#";

    if (isSponsor) {
        if (!amount || isNaN(amount) || parseFloat(amount) < 10) {
            alert("Minimum sponsorship amount is ₹10.");
            return;
        }
        if (!transactionId || transactionId.length !== 23) {
            alert("Please enter a valid 23-character Transaction ID.");
            return;
        }
    }

    const formURL = `https://docs.google.com/forms/d/e/1FAIpQLSdeulDHC05Ug16iyAp19MUI334OlqmlrYYt2lF1dCYFe0DtPw/formResponse` +
        `?entry.1328315084=${encodeURIComponent(projectName)}` +
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

        joinProjectForm.reset();
        sponsorFieldsDiv.style.display = 'none';
        qrCodeContainer.style.display = 'none';
        qrCodeDiv.innerHTML = '';
        const existingBtn = document.getElementById('upiPaymentBtn');
        if (existingBtn) existingBtn.remove();

        showThankYouModal(isSponsor, projectName);
    } catch (error) {
        console.error("Form submission failed:", error);
        alert("Failed to submit. Please try again.");
    }
});


    function showThankYouModal(isSponsor, projectName) {
    const modal = document.getElementById('thankYouModal');
    const content = document.getElementById('thankYouContent');

    content.classList.remove('scale-90', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');

    if (isSponsor) {
        content.innerHTML = `
            <h2 class="text-green-600 text-3xl font-semibold mb-3">🎉 Thanks for funding!</h2>
            <p class="text-gray-700 text-lg">We’ll review your transaction and add you to our sponsors list.</p>
            <p class="text-gray-600 mt-3">Feel free to contact us for any help.</p>
        `;

        triggerBlastEffect();
    } else {
        content.innerHTML = `
            <h2 class="text-blue-600 text-2xl font-semibold mb-2">🙌 Thanks for joining!</h2>
            <p class="text-gray-700">We’ll review your application and respond shortly.</p>
            <p class="text-gray-600 mt-2">Welcome to the <strong>${projectName}</strong> team!</p>
        `;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
        modal.classList.add('hidden');

        // Stop confetti on modal close just in case
        if (typeof $ !== 'undefined' && $.confetti) {
            $.confetti.stop();
        }
    }, 6000);
    }
    
    function triggerBlastEffect() {
    const blastContainer = document.getElementById('blastContainer');
    const PARTICLE_COUNT = 128;
    const PARTICLE_SIZE = {w: 8, h: 6};
    const containerWidth = 1024;
    const containerHeight = 700;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const colors = ['bg-yellow-400', 'bg-red-500', 'bg-orange-500', 'bg-white'];

    blastContainer.innerHTML = '';
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div');
        p.classList.add('absolute', 'rounded-sm', colors[Math.floor(Math.random() * colors.length)]);

        Object.assign(p.style, {
            width: PARTICLE_SIZE.w + 'px',
            height: PARTICLE_SIZE.h + 'px',
            left: (centerX - PARTICLE_SIZE.w/2) + 'px',
            top: (centerY - PARTICLE_SIZE.h/2) + 'px',
            opacity: '0',
            transformOrigin: 'center center',
        });

        blastContainer.appendChild(p);
        particles.push(p);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function cubicBezier(p0, c0, c1, p1, t) {
        const nt = 1 - t;
        return {
            x: nt**3*p0.x + 3*nt**2*t*c0.x + 3*nt*t**2*c1.x + t**3*p1.x,
            y: nt**3*p0.y + 3*nt**2*t*c0.y + 3*nt*t**2*c1.y + t**3*p1.y
        };
    }

    const paths = particles.map(() => ({
        p0: {x: centerX, y: centerY},
        p1: {x: Math.random() * containerWidth, y: Math.random() * containerHeight},
        p2: {x: Math.random() * containerWidth, y: Math.random() * containerHeight},
        p3: {x: Math.random() * containerWidth, y: containerHeight + 128}
    }));

    const start = performance.now();

    function animate(time) {
        const duration = 5000;
        const elapsed = time - start;
        const t = Math.min(elapsed / duration, 1);
        const easedT = easeOutCubic(t);

        particles.forEach((p, i) => {
            const pos = cubicBezier(paths[i].p0, paths[i].p1, paths[i].p2, paths[i].p3, easedT);
            p.style.left = `${pos.x - PARTICLE_SIZE.w/2}px`;
            p.style.top = `${pos.y - PARTICLE_SIZE.h/2}px`;
            p.style.opacity = '1';
            p.style.transform = `rotate(${easedT * 720}deg) scaleY(${Math.sin(Math.PI * easedT * 10).toFixed(2)})`;
        });

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            blastContainer.innerHTML = '';
        }
    }

    requestAnimationFrame(animate);
}


});

transactionIdInput.addEventListener('input', () => {
    const transactionId = transactionIdInput.value.trim();
    const isValid = transactionId.length === 23;

    if (!isValid) {
        paymentStatus.textContent = "Transaction ID must be exactly 23 characters.";
        paymentStatus.style.color = "red";
    } else {
        paymentStatus.textContent = "Transaction ID is valid.";
        paymentStatus.style.color = "green";
    }
});
