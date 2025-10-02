document.addEventListener('DOMContentLoaded', () => {
    // Custom cursor
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);

    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'cursor-follower';
    document.body.appendChild(cursorFollower);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 100);
    });

    // Pricing toggle
    const toggle = document.querySelector('.switch input');
    const prices = document.querySelectorAll('.price');
    const periods = document.querySelectorAll('.period');
    const discount = document.querySelector('.discount');

    const monthlyPrices = ['$99', '$199', '$299'];
    const yearlyPrices = ['$990', '$1990', '$2990'];

    toggle.addEventListener('change', () => {
        prices.forEach((price, index) => {
            price.textContent = toggle.checked ? yearlyPrices[index] : monthlyPrices[index];
        });

        periods.forEach(period => {
            period.textContent = toggle.checked ? '/year' : '/mo';
        });

        discount.style.display = toggle.checked ? 'inline-block' : 'none';
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Card hover effects
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursorFollower.style.transform = 'scale(1.5)';
        });

        card.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursorFollower.style.transform = 'scale(1)';
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .faq-item, .comparison-table').forEach(el => {
        observer.observe(el);
    });

    // Price calculation based on features
    const featureCheckboxes = document.querySelectorAll('.feature-checkbox');
    const totalPrice = document.querySelector('.total-price');

    function updateTotalPrice() {
        let total = 0;
        featureCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                total += parseInt(checkbox.dataset.price);
            }
        });
        totalPrice.textContent = `$${total}`;
    }

    featureCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });

    // Local storage for user preferences
    const savePreferences = () => {
        const preferences = {
            pricingType: toggle.checked ? 'yearly' : 'monthly',
            selectedFeatures: Array.from(featureCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.id)
        };
        localStorage.setItem('pricingPreferences', JSON.stringify(preferences));
    };

    const loadPreferences = () => {
        const saved = localStorage.getItem('pricingPreferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            toggle.checked = preferences.pricingType === 'yearly';
            preferences.selectedFeatures.forEach(featureId => {
                const checkbox = document.getElementById(featureId);
                if (checkbox) checkbox.checked = true;
            });
            updateTotalPrice();
        }
    };

    toggle.addEventListener('change', savePreferences);
    featureCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', savePreferences);
    });

    loadPreferences();
}); 