
templates = [
    'classic-youtube', 'minimal-subscribe', 'social-instagram', 'social-tiktok', 'social-facebook',
    'social-twitter', 'notification-bell', 'channel-footer', 'join-discord', 'patreon-support',
    'swipe-up', 'app-store', 'play-store', 'website-visit', 'shop-now', 'discount-badge',
    'newsletter-signup', 'like-comment-share', 'qrcode-scan', 'location-pin',
    'generic-blue', 'generic-gradient', 'generic-outline', 'generic-3d', 'marketing-pill',
    'neon-pulse', 'cyberpunk-glitch', 'retro-pixel', 'hand-drawn', 'speech-bubble',
    'glassmorphism', 'modern-float', 'corner-ribbon', 'search-bar', 'loading-complete',
    'mouse-cursor', 'finger-tap', 'live-badge', 'upcoming-event', 'review-stars',
    'flash-sale', 'add-to-cart', 'limited-time', 'free-shipping', 'buy-one-get-one',
    'promo-code', 'seasonal-sale', 'best-seller', 'new-arrival', 'pre-order',
    'start-free-trial', 'download-now', 'book-demo', 'api-access', 'cloud-upload',
    'security-verified', 'dark-mode-toggle', 'ai-feature', 'software-update', 'code-snippet',
    'book-appointment', 'telehealth-call', 'healthy-choice', 'workout-join', 'meditation-start',
    'nutrition-facts', 'organic-badge', 'medical-trust', 'fitness-goal', 'pharmacy-delivery',
    'enroll-now', 'download-ebook', 'webinar-register', 'course-certificate', 'study-group',
    'library-access', 'lesson-start', 'quiz-time', 'teacher-approved', 'student-discount',
    'crypto-buy', 'stock-market-up', 'secure-payment', 'wallet-connect', 'invest-now',
    'credit-card-apply', 'savings-piggy', 'chart-growth', 'bitcoin-accept', 'insurance-protect',
    'open-house', 'sold-badge', 'virtual-tour', 'mortgage-calc', 'dream-home',
    'rent-now', 'agent-contact', 'property-feature', 'key-handover', 'interior-design',
    'book-flight', 'hotel-checkin', 'destination-pin', 'holiday-package', 'passport-stamp',
    'travel-guide', 'luggage-tag', 'explore-world', 'beach-vibes', 'mountain-hike',
    'order-delivery', 'menu-view', 'chef-recommend', 'spicy-warning', 'vegan-badge',
    'coffee-break', 'recipe-save', 'table-reserve', 'fast-food-combo', 'fresh-ingredients'
]

import json

clips = []

# Add Gap of 600 frames
clips.append({
    "OTIO_SCHEMA": "Gap.1",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": 30.0, "value": 600.0 },
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
})

for t in templates:
    clips.append({
        "OTIO_SCHEMA": "Clip.2",
        "metadata": {
            "remotion_component": "CallToAction",
            "props": {
                "template": t,
                "title": t.upper().replace('-', ' '),
                "subtitle": "Preview Template"
            }
        },
        "name": f"CTA: {t}",
        "source_range": {
            "OTIO_SCHEMA": "TimeRange.1",
            "duration": { "rate": 30.0, "value": 60.0 },
            "start_time": { "rate": 30.0, "value": 0.0 }
        },
        "media_references": {
            "DEFAULT_MEDIA": {
                "OTIO_SCHEMA": "MissingReference.1",
                "metadata": {},
                "name": ""
            }
        },
        "active_media_reference_key": "DEFAULT_MEDIA"
    })

track = {
    "OTIO_SCHEMA": "Track.1",
    "metadata": {},
    "name": "CTA Gallery Preview",
    "source_range": None,
    "effects": [],
    "markers": [],
    "enabled": True,
    "color": None,
    "children": clips,
    "kind": "Video"
}

# Instead of printing, write to a file to be read later
with open('cta_track.json', 'w') as f:
    json.dump(track, f, indent=4)
