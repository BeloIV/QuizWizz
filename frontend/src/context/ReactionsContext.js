import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '../config';

const REACTION_KEY = 'quizwizz:reactions';

const ReactionsContext = createContext({
    reactions: {},
    recordReaction: () => {},
});

function readInitialReactions() {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const raw = localStorage.getItem(REACTION_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);

        return Object.fromEntries(
            Object.entries(parsed).map(([quizId, value]) => {
                if (typeof value === 'object' && value !== null && 'value' in value) {
                    return [quizId, value];
                }
                if (value === 'like' || value === 'dislike') {
                    return [quizId, { value, reactedAt: Date.now() }];
                }
                // Ignore unknown values
                return [quizId, undefined];
            })
        );
    } catch (error) {
        console.warn('Failed to parse stored reactions', error);
        return {};
    }
}

export function ReactionsProvider({ children }) {
    const [reactions, setReactions] = useState(readInitialReactions);

    useEffect(() => {
        try {
            localStorage.setItem(REACTION_KEY, JSON.stringify(reactions));
        } catch (error) {
            console.warn('Failed to persist reactions', error);
        }
    }, [reactions]);

    const recordReaction = useCallback(async (quizId, currentReaction, previousReaction) => {
        if (!quizId) return;

        let endpoint;
        if (currentReaction === "like") endpoint = "like";
        else if (currentReaction === "dislike") endpoint = "dislike";
        else endpoint = previousReaction;

        // Get CSRF token from cookie
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

        const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/${endpoint}/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            },
            body: JSON.stringify({
                previous: previousReaction,
                current: currentReaction
            })
        });

        const data = await res.json();

        setReactions((prev) => ({
            ...prev,
            [quizId]: {
                userReaction: currentReaction,
                likes: data.likes,
                dislikes: data.dislikes,
                reactedAt: Date.now()
            }
        }));
    }, []);

    const value = useMemo(
        () => ({ reactions, recordReaction }),
        [reactions, recordReaction]
    );

    return (
        <ReactionsContext.Provider value={value}>
            {children}
        </ReactionsContext.Provider>
    );
}

export function useReactions() {
    return useContext(ReactionsContext);
}