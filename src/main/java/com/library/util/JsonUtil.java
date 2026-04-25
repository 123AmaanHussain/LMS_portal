package com.library.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/** Shared Gson instance for JSON serialization/deserialization. */
public class JsonUtil {
    public static final Gson GSON = new GsonBuilder()
            .serializeNulls()
            .setPrettyPrinting()
            .create();

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }
}
