import { useEffect, useRef } from 'react';

function Drawer({ isOpen, onClose }) {
    const drawerRef = useRef(null);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.classList.toggle('menu-open', isOpen);
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className="drawer-overlay"
                onClick={onClose}
                role="presentation"
            />
            <div
                className="drawer"
                ref={drawerRef}
                role="navigation"
                aria-label="Main navigation"
            >
                <nav className="drawer-menu">
                    <div className="drawer-menu-item">
                        <div className="drawer-menu-link">
                            Account
                        </div>
                        <div className="drawer-menu-note">
                            Not implemented yet
                        </div>
                    </div>
                </nav>
            </div>
        </>
    );
}

export default Drawer;
