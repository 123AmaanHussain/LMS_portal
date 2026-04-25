package com.library.config;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads environment variables from a .env file in the working directory.
 * System environment variables always take priority over .env file values.
 */
public class EnvLoader {

    private static final Map<String, String> ENV_MAP = new HashMap<>();

    static {
        File envFile = new File(".env");
        if (envFile.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;

                    int idx = line.indexOf('=');
                    if (idx > 0) {
                        String key   = line.substring(0, idx).trim();
                        String value = line.substring(idx + 1).trim();
                        // Strip surrounding quotes if present
                        if (value.length() >= 2 &&
                            ((value.startsWith("\"") && value.endsWith("\"")) ||
                             (value.startsWith("'")  && value.endsWith("'")))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        ENV_MAP.put(key, value);
                    }
                }
                System.out.println("[EnvLoader] ✓ Loaded .env file from: " + envFile.getAbsolutePath());
            } catch (IOException e) {
                System.err.println("[EnvLoader] ✗ Error reading .env: " + e.getMessage());
            }
        } else {
            System.out.println("[EnvLoader] No .env file found — using system environment variables.");
        }
    }

    /** Returns the value for the given key. System env takes priority over .env file. */
    public static String get(String key) {
        String sysValue = System.getenv(key);
        return (sysValue != null && !sysValue.isBlank())
            ? sysValue
            : ENV_MAP.getOrDefault(key, "");
    }

    /** Returns the value or a default if absent / blank. */
    public static String get(String key, String defaultValue) {
        String val = get(key);
        return val.isBlank() ? defaultValue : val;
    }
}
