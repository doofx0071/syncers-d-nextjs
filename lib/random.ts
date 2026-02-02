const adjectives = [
    "Swift", "Mighty", "Clever", "Brave", "Silent",
    "Golden", "Silver", "Crimson", "Azure", "Frosty",
    "Wild", "Noble", "Quick", "Calm", "Bold",
    "Shiny", "Mystic", "Sly", "Fast", "Smart"
];

const animals = [
    "Hawk", "Lion", "Fox", "Wolf", "Eagle",
    "Tiger", "Bear", "Shark", "Falcon", "Panther",
    "Owl", "Deer", "Panda", "Raven", "Dolphin",
    "Lynx", "Condor", "Cobra", "Jaguar", "Stallion"
];

export function generateFunName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj} ${animal}`;
}

export function generateShortId() {
    // Generates xxx-xxx-xxx format
    const part = () => Math.random().toString(36).substring(2, 5);
    return `${part()}-${part()}-${part()}`;
}

export function generateUniqueId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts or older browsers
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
