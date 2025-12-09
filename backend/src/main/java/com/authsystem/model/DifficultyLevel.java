package com.authsystem.model;

/**
 * Difficulty Level Enum
 * Used for content classification and adaptive learning
 */
public enum DifficultyLevel {
    BEGINNER("Beginner", 1),
    INTERMEDIATE("Intermediate", 2),
    ADVANCED("Advanced", 3);
    
    private final String displayName;
    private final int level;
    
    DifficultyLevel(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getLevel() {
        return level;
    }
    
    public DifficultyLevel getNext() {
        switch (this) {
            case BEGINNER:
                return INTERMEDIATE;
            case INTERMEDIATE:
                return ADVANCED;
            case ADVANCED:
                return ADVANCED; // Already at max
            default:
                return BEGINNER;
        }
    }
    
    public DifficultyLevel getPrevious() {
        switch (this) {
            case ADVANCED:
                return INTERMEDIATE;
            case INTERMEDIATE:
                return BEGINNER;
            case BEGINNER:
                return BEGINNER; // Already at min
            default:
                return BEGINNER;
        }
    }
    
    public static DifficultyLevel fromString(String text) {
        for (DifficultyLevel level : DifficultyLevel.values()) {
            if (level.displayName.equalsIgnoreCase(text) || level.name().equalsIgnoreCase(text)) {
                return level;
            }
        }
        return BEGINNER; // Default
    }
}
