export const formatAbilityDescription = (
    description: string,
    abilityValues: Record<string, string>
): string => {
    let formattedDescription = description.replace(/%%/g, '%');

    formattedDescription = formattedDescription.replace(/\\n\\n/g, '\n\n');

    formattedDescription = formattedDescription.replace(/\n/g, '<br />');

    formattedDescription = formattedDescription.replace(/%([a-zA-Z0-9_]+)%/g, (match, placeholder) => {
        if (abilityValues[placeholder]) {
            return `<span style="color: #ffcc00; font-weight: bold;">${abilityValues[placeholder]}</span>`;
        }
        return match;
    });

    return formattedDescription;
};
