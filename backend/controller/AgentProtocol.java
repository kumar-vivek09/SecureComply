import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class AgentProtocol {

    private static final Pattern FIELD_PATTERN = Pattern.compile("\\\"((?:\\\\.|[^\\\\\"])*)\\\"\\s*:\\s*(\\\"((?:\\\\.|[^\\\\\"])*)\\\"|true|false|null|-?\\d+(?:\\.\\d+)?)");

    private AgentProtocol() {
    }

    public static Map<String, String> parse(String json) {
        Map<String, String> values = new LinkedHashMap<>();

        if (json == null) {
            return values;
        }

        Matcher matcher = FIELD_PATTERN.matcher(json.trim());
        while (matcher.find()) {
            String key = unescape(matcher.group(1));
            String rawValue = matcher.group(2);

            if (rawValue.startsWith("\"") && rawValue.endsWith("\"")) {
                values.put(key, unescape(rawValue.substring(1, rawValue.length() - 1)));
            } else {
                values.put(key, rawValue);
            }
        }

        return values;
    }

    public static String build(String type, Map<String, String> fields) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("type", type);

        if (fields != null) {
            message.putAll(fields);
        }

        return toJson(message);
    }

    public static String toJson(Map<String, String> fields) {
        StringBuilder builder = new StringBuilder();
        builder.append('{');

        boolean first = true;
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (!first) {
                builder.append(',');
            }

            first = false;
            builder.append('"').append(escape(entry.getKey())).append('"').append(':');

            String value = entry.getValue();
            if (value == null) {
                builder.append("null");
            } else if (isBoolean(value) || isNumber(value)) {
                builder.append(value);
            } else {
                builder.append('"').append(escape(value)).append('"');
            }
        }

        builder.append('}');
        return builder.toString();
    }

    public static String toJsonObject(Map<String, Object> fields) {
        StringBuilder builder = new StringBuilder();
        builder.append('{');
        boolean first = true;
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            if (!first) builder.append(',');
            first = false;
            builder.append('"').append(escape(entry.getKey())).append("\":");
            appendObject(builder, entry.getValue());
        }
        builder.append('}');
        return builder.toString();
    }

    private static void appendObject(StringBuilder builder, Object value) {
        if (value == null) {
            builder.append("null");
        } else if (value instanceof Boolean || value instanceof Number) {
            builder.append(value);
        } else if (value instanceof String) {
            builder.append('"').append(escape((String) value)).append('"');
        } else if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) value;
            builder.append(toJsonObject(map));
        } else if (value instanceof Iterable) {
            builder.append('[');
            boolean first = true;
            for (Object item : (Iterable<?>) value) {
                if (!first) builder.append(',');
                first = false;
                appendObject(builder, item);
            }
            builder.append(']');
        } else if (value.getClass().isEnum()) {
            builder.append('"').append(escape(((Enum<?>)value).name())).append('"');
        } else {
            builder.append('"').append(escape(value.toString())).append('"');
        }
    }

    public static String value(Map<String, String> fields, String key, String defaultValue) {
        if (fields == null) {
            return defaultValue;
        }

        String value = fields.get(key);
        return value == null || value.trim().isEmpty() ? defaultValue : value;
    }

    public static boolean booleanValue(Map<String, String> fields, String key, boolean defaultValue) {
        String value = value(fields, key, String.valueOf(defaultValue));
        return "true".equalsIgnoreCase(value) || "1".equals(value);
    }

    public static String requireValue(Map<String, String> fields, String key) {
        String value = value(fields, key, null);
        if (value == null) {
            throw new IllegalArgumentException("Missing field: " + key);
        }
        return value;
    }

    private static boolean isBoolean(String value) {
        return "true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value);
    }

    private static boolean isNumber(String value) {
        return value != null && value.matches("-?\\d+(?:\\.\\d+)?");
    }

    private static String escape(String value) {
        StringBuilder builder = new StringBuilder();
        for (char ch : value.toCharArray()) {
            switch (ch) {
                case '\\':
                    builder.append("\\\\");
                    break;
                case '"':
                    builder.append("\\\"");
                    break;
                case '\n':
                    builder.append("\\n");
                    break;
                case '\r':
                    builder.append("\\r");
                    break;
                case '\t':
                    builder.append("\\t");
                    break;
                default:
                    builder.append(ch);
            }
        }
        return builder.toString();
    }

    private static String unescape(String value) {
        StringBuilder builder = new StringBuilder();
        boolean escaping = false;

        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (escaping) {
                switch (ch) {
                    case 'n':
                        builder.append('\n');
                        break;
                    case 'r':
                        builder.append('\r');
                        break;
                    case 't':
                        builder.append('\t');
                        break;
                    case '"':
                        builder.append('"');
                        break;
                    case '\\':
                        builder.append('\\');
                        break;
                    default:
                        builder.append(ch);
                        break;
                }
                escaping = false;
            } else if (ch == '\\') {
                escaping = true;
            } else {
                builder.append(ch);
            }
        }

        return builder.toString();
    }
}