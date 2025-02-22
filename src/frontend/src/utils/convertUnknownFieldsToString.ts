export const convertUnknownFieldsToString = (
    data: any
): Record<string, string | Record<string, string | object>> => {
    const result: Record<string, string | Record<string, string | object>> = {};

    Object.entries(data).forEach(([key, value]) => {
        if (key === "values" && typeof value === "object" && value !== null) {
            result[key] = Object.fromEntries(
                Object.entries(value).map(([nestedKey, nestedValue]) => {
                    if (typeof nestedValue === "object" && nestedValue !== null) {
                        return [nestedKey, nestedValue];
                    }
                    return [nestedKey, String(nestedValue)];
                })
            );
        } else if (value !== null && typeof value !== "object") {
            result[key] = String(value);
        } else if (value && typeof value === "object") {
            result[key] = value as Record<string, string | object>;
        } else {
            result[key] = 'null';
        }
    });

    return result;
};
