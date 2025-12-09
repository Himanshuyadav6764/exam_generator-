package com.authsystem.model;

import java.util.List;
import java.util.ArrayList;

/**
 * Wrapper class for MongoDB serialization of topic with its subcontents
 * This helps MongoDB properly serialize the nested structure
 */
public class TopicWithSubcontents {
    
    private String topicName;
    private List<TopicSubcontent> subcontents;

    public TopicWithSubcontents() {
        this.subcontents = new ArrayList<>();
    }

    public TopicWithSubcontents(String topicName, List<TopicSubcontent> subcontents) {
        this.topicName = topicName;
        this.subcontents = subcontents != null ? subcontents : new ArrayList<>();
    }

    // Getters and Setters
    public String getTopicName() {
        return topicName;
    }

    public void setTopicName(String topicName) {
        this.topicName = topicName;
    }

    public List<TopicSubcontent> getSubcontents() {
        return subcontents;
    }

    public void setSubcontents(List<TopicSubcontent> subcontents) {
        this.subcontents = subcontents;
    }
}
