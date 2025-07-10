import React, { useState, useEffect, useRef } from 'react';
import "../styles/pages/Home.css";

// Custom Hook
function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold }
        );

        if (ref.current) observer.observe(ref.current);
        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [threshold]);

    return [ref, isVisible] as const;
}

const galleryImages = [
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3265_dxyju4.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055537/IMG_3271_hbpjvf.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055537/IMG_3270_mqeq6s.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055536/IMG_3272_wqaape.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055536/IMG_3269_xzsyux.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055536/IMG_3274_kzd4lw.jpg',
];

const miniGallery = [
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055538/IMG_3273_peyrka.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3264_jqmiz2.jpg',
    'https://res.cloudinary.com/dboau6axv/image/upload/v1752055539/IMG_3268_bmtqva.jpg',
];

const Home: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [heroRef, heroVisible] = useInView();
    const [serviceRef, serviceVisible] = useInView();
    const [contactRef, contactVisible] = useInView();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev === galleryImages.length - 1 ? 0 : prev + 1
            );
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleRadioChange = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="homepage">
            {/* ✅ Hero Section */}
            <section
                ref={heroRef}
                className={`homepage-hero-section fade-in-section ${heroVisible ? 'visible' : ''}`}
            >
                <div className="homepage-hero-content">
                    <h1>Welcome to PORCHOEN 2014 COMPANY LIMITED</h1>
                    <h2>
                        We specialize in container transportation services across Thailand, ensuring secure, efficient, and on-time delivery with professional logistics solutions tailored to your needs.
                    </h2>
                </div>
            </section>

            {/* ✅ Slideshow */}
            <section className="homepage-slideshow-section">
                <div className="homepage-slideshow">
                    <div className="homepage-slide-container">
                        {galleryImages.map((url, index) => (
                            <div
                                className={`homepage-slide ${index === currentIndex ? 'active' : ''}`}
                                key={index}
                            >
                                <div
                                    className="homepage-bg-cover"
                                    style={{ backgroundImage: `url(${url})` }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="homepage-radio-indicators">
                        {galleryImages.map((_, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name="gallery-radio"
                                    checked={index === currentIndex}
                                    onChange={() => handleRadioChange(index)}
                                />
                                <span className="radio-dot" />
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* ✅ Services */}
            <section
                ref={serviceRef}
                className={`homepage-section fade-in-section ${serviceVisible ? 'visible' : ''}`}
            >
                <h2 className="homepage-section-title">Our Services</h2>
                <div className="homepage-card-grid">
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🚚</div>
                        <h3>Nationwide Container Delivery</h3>
                        <p>On-time and reliable delivery of containers to every region.</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">📍</div>
                        <h3>Real-Time Cargo Tracking</h3>
                        <p>Monitor your shipments live from dispatch to destination.</p>
                    </div>
                    <div className="homepage-service-card">
                        <div className="homepage-icon">🛡️</div>
                        <h3>Secure & Safe Handling</h3>
                        <p>Rigorous security standards to protect your goods at all times.</p>
                    </div>

                    {/* Mini Gallery */}
                    <div className="homepage-mini-gallery-grid">
                        {miniGallery.slice(0, 6).map((url, i) => (
                            <div
                                className="mini-image-grid-item"
                                key={`mini-${i}`}
                                style={{ backgroundImage: `url(${url})` }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ✅ Contact */}
            <section
                ref={contactRef}
                className={`homepage-section contact-section fade-in-section ${contactVisible ? 'visible' : ''}`}
            >
                <h2 className="homepage-section-title">Contact Us</h2>
                <form
                    className="contact-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        alert("Thank you! We'll get back to you via email.");
                    }}
                >
                    <input type="text" name="name" placeholder="Your Name" required />
                    <input type="email" name="email" placeholder="Your Email" required />
                    <textarea name="message" rows={5} placeholder="Your Message..." required />
                    <button type="submit">Send Message</button>
                </form>

                <div className="contact-channels">
                    <h3>Other Ways to Reach Us</h3>
                    <ul>
                        <li>
                            <strong>Email:</strong>{' '}
                            <a href="mailto:porchoen2014@gmail.com">porchoen2014@gmail.com</a>
                        </li>
                        <li>
                            <strong>LINE:</strong> <span>@porchoen2014</span>
                        </li>
                        <li>
                            <strong>WeChat:</strong> <span>porchoen2014</span>
                        </li>
                        <li>
                            <strong>Location:</strong>{' '}
                            <a
                                href="https://maps.app.goo.gl/zAmb4MCx7rUvTZqz7"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                PORCHOEN 2014 COMPANY LIMITED
                                 , 101, ต.เวียง อ.เชียงแสน จ.เชียงราย
                            </a>
                        </li>
                    </ul>
                </div>
            </section>

            <footer className="homepage-footer">
                <div>
                    <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
                </div>
                <p>© PORCHOEN 2014 COMPANY LIMITED.</p>
            </footer>
        </div>
    );
};

export default Home;
