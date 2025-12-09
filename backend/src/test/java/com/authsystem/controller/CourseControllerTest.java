package com.authsystem.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class CourseControllerTest {

    private CourseController controller;
    private Method parseMethod;

    @BeforeEach
    void setUp() throws NoSuchMethodException {
        controller = new CourseController();
        parseMethod = CourseController.class.getDeclaredMethod("parseTopicFileKey", String.class, String.class);
        parseMethod.setAccessible(true);
    }

    private Object invokeParse(String paramName, String prefix) throws InvocationTargetException, IllegalAccessException {
        return parseMethod.invoke(controller, paramName, prefix);
    }

    private String extractTopicName(Object key) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Method topicNameMethod = key.getClass().getDeclaredMethod("topicName");
        topicNameMethod.setAccessible(true);
        return (String) topicNameMethod.invoke(key);
    }

    private int extractSubcontentIndex(Object key) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Method indexMethod = key.getClass().getDeclaredMethod("subcontentIndex");
        indexMethod.setAccessible(true);
        return (Integer) indexMethod.invoke(key);
    }

    @Test
    void parsesTopicNamesWithSpacesAndFileIndex() throws Exception {
        Object key = invokeParse("topicVideos_AI & ML Basics_3_1", "topicVideos_");
        assertNotNull(key, "Expected parser to extract topic data");
        assertEquals("AI & ML Basics", extractTopicName(key));
        assertEquals(3, extractSubcontentIndex(key));
    }

    @Test
    void parsesLegacyParameterWithoutFileIndex() throws Exception {
        Object key = invokeParse("topicPdfs_Algorithms_2", "topicPdfs_");
        assertNotNull(key);
        assertEquals("Algorithms", extractTopicName(key));
        assertEquals(2, extractSubcontentIndex(key));
    }

    @Test
    void returnsNullWhenFormatInvalid() throws Exception {
        assertNull(invokeParse("topicVideos_Malformed", "topicVideos_"));
        assertNull(invokeParse("topicVideos__0", "topicVideos_"));
        assertNull(invokeParse("topicVideos_Topic_noNumber", "topicVideos_"));
    }
}
