import React, { useState, useEffect, memo } from 'react';

interface TypewriterProps {
    phrases: readonly string[];
    className?: string;
}

/**
 * Typewriter component that cycles through phrases with a typing animation.
 * Memoized to prevent re-renders from propagating to parent components.
 */
const TypewriterComponent: React.FC<TypewriterProps> = ({ phrases, className = '' }) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        const tick = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];
            const updatedText = isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1);

            setText(updatedText);

            // Randomized smooth typing speed
            let delta = 100 - Math.random() * 40;

            if (isDeleting) {
                delta /= 2; // Deleting is faster
            }

            if (!isDeleting && updatedText === fullText) {
                setIsDeleting(true);
                setTypingSpeed(2000); // Pause at end of word
            } else if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setLoopNum(prev => prev + 1);
                setTypingSpeed(500); // Short pause before new word
            } else {
                setTypingSpeed(delta);
            }
        };

        const ticker = setTimeout(tick, typingSpeed);
        return () => clearTimeout(ticker);
    }, [text, isDeleting, loopNum, typingSpeed, phrases]);

    return (
        <span className={className}>
            {text}
            <span className="animate-pulse">|</span>
        </span>
    );
};

// Memoize to prevent unnecessary re-renders
export const Typewriter = memo(TypewriterComponent);
