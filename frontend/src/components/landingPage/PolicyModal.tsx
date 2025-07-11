import React from "react";
import "../../styles/components/home/PolicyModal.css";

interface PolicyModalProps {
    isVisible: boolean;
    onClose: () => void;
    title: "Privacy Policy" | "Terms of Service";
}

const PolicyModal: React.FC<PolicyModalProps> = ({ isVisible, onClose, title }) => {
    if (!isVisible) return null;

    const contentMap: Record<string, string> = {
        "Privacy Policy": `
      We collect your data to enhance your experience. We do not share your personal data with third parties without consent.
      
      Information we collect may include your name, email address, and usage patterns. This data is securely stored and only used to improve our services.
      
      You have the right to request data deletion at any time. Contact us for more details.
    `,
        "Terms of Service": `
      By using our service, you agree to comply with our terms and conditions.
      
      Do not misuse our platform. This includes attempting to hack, extract, or reverse-engineer any part of our service.
      
      We reserve the right to terminate access to users who violate these terms.
    `
    };

    return (
        <div className="policy-modal-overlay">
            <div className="policy-modal">
                <button onClick={onClose} className="policy-close-button">×</button>
                <h2>{title}</h2>
                <div className="policy-content">
                    <p>{contentMap[title]}</p>
                </div>
            </div>
        </div>
    );
};

export default PolicyModal;
